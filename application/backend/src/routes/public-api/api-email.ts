import {mailReader, appendToMailbox, deleteEmail} from '@utils/email-imap';
import middlewareApi from '@middlewares/middleware-api';
import {sendIdentityEmail} from '@utils/email-smtp';
import type {APIRequest, EmailContent, Mailbox} from '@type';
import {checkAPI} from '@utils/checks';
import {throttle} from '@core/states';
import {error} from '@utils/utils';
import {Elysia} from 'elysia';

function location(value: unknown) {
  const body = value as Record<string, unknown> | null;
  const mailbox = body?.mailbox;
  const uid = typeof body?.uid === 'string' ? Number(body.uid) : body?.uid;

  if (!['INBOX', 'Sent', 'Drafts', 'Junk'].includes(String(mailbox)) || !Number.isSafeInteger(uid) || Number(uid) < 1) {
    return null;
  }

  return {mailbox: mailbox as Mailbox, uid: uid as number};
}

function withoutAttachments(email: NonNullable<Awaited<ReturnType<typeof mailReader.message>>>) {
  return {...email, attachments: email.attachments.map(({data: _data, ...file}, index) => ({...file, index}))};
}

export default new Elysia({prefix: '/api/identities/:id/mail'})
  .use(middlewareApi)
  .get(
    '/messages',
    async ({set, identity, query}) => {
      const mailbox = query.mailbox;
      const before = query.before === undefined ? undefined : Number(query.before);

      if (!['INBOX', 'Sent', 'Drafts', 'Junk'].includes(mailbox || '') || (before !== undefined && (!Number.isSafeInteger(before) || before < 1))) {
        return error(set, 400, 'Invalid mailbox or cursor');
      }

      return mailReader.list(identity!.email, identity!.email_password, mailbox as Mailbox, before);
    },
    {
      beforeHandle: ({identity, set, query}) => {
        return throttle(`Email Fetch ${query.mailbox}:${query.before || ''}`, 3_000).beforeHandle({identity, set});
      },
    },
  )
  .get('/message', async ({set, identity, query}) => {
    const source = location(query);

    if (!source) {
      return error(set, 400, 'Invalid mailbox or UID');
    }

    const email = await mailReader.message(identity!.email, identity!.email_password, source.mailbox, source.uid);

    if (!email) {
      return error(set, 404, 'Email not found');
    }

    return {email: withoutAttachments(email)};
  })
  .get('/attachment', async ({set, identity, query}) => {
    const source = location(query);
    const index = Number(query.index);

    if (!source || query.index === undefined || !Number.isSafeInteger(index) || index < 0) {
      return error(set, 400, 'Invalid attachment location');
    }

    const attachment = await mailReader.attachment(identity!.email, identity!.email_password, source.mailbox, source.uid, index);

    if (!attachment) {
      return error(set, 404, 'Attachment not found');
    }

    return {attachment};
  })
  .get('/reply', async ({set, identity, query}) => {
    const uuid = query.uuid;

    if (!uuid || uuid.length > 998 || !/^<[^<>\s]+@[^<>\s]+>$/.test(uuid)) {
      return error(set, 400, 'Invalid Message-ID');
    }

    const email = await mailReader.reply(identity!.email, identity!.email_password, uuid);

    return {fetchEmail: email ? withoutAttachments(email) : null};
  })
  .post('/messages', async ({set, identity, body}) => {
    const requestedDraft = (body as Record<string, unknown>)?.draft;

    if (requestedDraft != null && (!Number.isSafeInteger(requestedDraft) || Number(requestedDraft) < 1)) {
      return error(set, 400, 'Invalid draft UID');
    }

    const fields = ['to', '?inReplyTo', '?references', '?attachments', 'subject', 'body'];
    const {err, to, inReplyTo, references, attachments, subject, body: emailBody, draft} = await checkAPI(body, fields);

    if (err) {
      return error(set, 400, err);
    }

    const email = identity!.email;
    const password = identity!.email_password;
    const flatReferences = Array.isArray(references) ? references.flat(Infinity) : references;
    const content = {email, password, to, subject, body: emailBody, attachments, references: flatReferences, inReplyTo};

    const response = await sendIdentityEmail(content);

    if (!response.messageID) {
      return error(set, 400, 'Failed to send email');
    }

    const fullEmail = {...content, messageID: response.messageID, date: response.date};

    let uid;
    let warning;

    try {
      uid = (await appendToMailbox(false, fullEmail)).uid;

      if (draft) {
        await deleteEmail(email, password, 'Drafts', (body as APIRequest).draft);
      }
    } catch {
      warning = 'Email was sent, but saving it in Sent or removing its draft failed. Do not resend it.';
    }

    delete (fullEmail as {password?: string}).password;

    const sentEmail = {...fullEmail, uid, type: response.type};

    return {draft, sentEmail, warning};
  })
  .post('/forward', async ({set, identity, body}) => {
    const source = location(body);
    const {err, uid, forward} = await checkAPI(body, ['uid', 'forward']);

    if (err) {
      return error(set, 400, err);
    }

    if (!source) {
      return error(set, 400, 'Invalid mailbox or UID');
    }

    const email = await mailReader.message(identity!.email, identity!.email_password, source.mailbox, source.uid, false, true);

    if (!email) {
      return error(set, 404, 'Email not found');
    }

    if (email.type === 'html') {
      const escape = (value: unknown) =>
        String(value ?? '').replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char]!);
      email.body = `
      <p><strong>--- Forwarded Message ---</strong></p>
      <p><strong>From:</strong> ${escape(email.from)}</p>
      <p><strong>To:</strong> ${escape(forward)}</p>
      <p><strong>Subject:</strong> ${escape(email.subject)}</p>
      <p><strong>Date:</strong> ${escape(email.date)}</p>
      <p>${email.body}</p>
    `;
    } else {
      email.body = `
      --- Forwarded Message ---
      From: ${email.from}
      To: ${forward}
      Subject: ${email.subject}
      Date: ${email.date}

      ${email.body}
    `;
    }

    email.subject = email.subject.toUpperCase().startsWith('FWD: ') ? email.subject : `FWD: ${email?.subject}`;

    const forwardContent = {...email, to: forward, email: identity!.email, password: identity!.email_password};

    const response = await sendIdentityEmail(forwardContent as EmailContent);

    if (!response.messageID) {
      return error(set, 400, 'Failed to forward email');
    }

    const fullEmail = {...forwardContent, messageID: response.messageID, date: response.date};
    let saved;
    let warning;

    try {
      saved = await appendToMailbox(false, fullEmail as EmailContent);
    } catch {
      warning = 'Email was forwarded, but saving it in Sent failed. Do not resend it.';
    }

    delete (fullEmail as {password?: string}).password;
    delete (fullEmail as {email?: string}).email;

    const forwardEmail = {...fullEmail, uid: saved?.uid, type: response.type};

    return {uid, forward, forwardEmail, warning};
  })
  .put('/draft', async ({set, identity, body}) => {
    const requestedDraft = (body as Record<string, unknown>)?.draft;

    if (requestedDraft != null && (!Number.isSafeInteger(requestedDraft) || Number(requestedDraft) < 1)) {
      return error(set, 400, 'Invalid draft UID');
    }

    const fields = ['to', '?inReplyTo', '?references', '?attachments', 'subject', 'body'];
    const {err, to, inReplyTo, references, attachments, subject, body: emailBody, draft} = await checkAPI(body, fields);

    if (err) {
      return error(set, 400, err);
    }

    const email = identity!.email;
    const password = identity!.email_password;
    const flatReferences = Array.isArray(references) ? references.flat(Infinity) : references;
    const content = {email, password, to, subject, body: emailBody, attachments, references: flatReferences, inReplyTo};

    const fullEmail = await appendToMailbox(true, content);

    let warning;
    let replacedDraft: number | undefined = draft;

    if (draft) {
      try {
        await deleteEmail(email, password, 'Drafts', (body as APIRequest).draft);
      } catch {
        replacedDraft = undefined;
        warning = 'Draft saved, but the previous draft could not be removed';
      }
    }

    delete (fullEmail as {password?: string}).password;
    delete (fullEmail as {email?: string}).email;

    const {password: _password, email: _email, ...safeContent} = content;
    const savedDraft = {...fullEmail, ...safeContent};

    return {draft: replacedDraft, savedDraft, warning};
  })
  .delete('/messages', async ({set, identity, body}) => {
    const {err, mailbox, uid} = await checkAPI(body, ['mailbox', 'uid']);

    if (err) {
      return error(set, 400, err);
    }

    await deleteEmail(identity!.email, identity!.email_password, mailbox!, (body as APIRequest).uid!);

    return {mailbox, uid};
  });
