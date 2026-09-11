import {fetchRecentEmails, appendToMailbox, deleteEmail, fetchEmail, fetchMoreEmails} from '@utils/email-imap';
import middlewareApi from '@middlewares/middleware-api';
import {sendIdentityEmail} from '@utils/email-smtp';
import type {APIRequest, EmailContent} from '@type';
import {checkAPI} from '@utils/checks';
import {throttle} from '@core/states';
import {error} from '@utils/utils';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/email'})
  .use(middlewareApi)
  .get(
    '/:id',
    async ({identity}) => {
      const emails = await fetchRecentEmails(identity!.email, identity!.email_password);
      return {emails};
    },
    throttle('Initial Email Fetch', 3_000),
  )
  .get(
    '/load-more/:id',
    async ({set, identity, query}) => {
      const {err, mailbox, since} = await checkAPI(query, ['mailbox', 'since']);
      if (err) return error(set, 400, err);

      const nextEmails = await fetchMoreEmails(identity!.email, identity!.email_password, mailbox!, Number(since!));
      return {mailbox, since, nextEmails};
    },
    throttle('More Email Fetch', 3_000),
  )
  .get('/fetch-reply/:id', async ({set, identity, query}) => {
    const {err, uuid} = await checkAPI(query, ['uuid']);
    if (err) return error(set, 400, err);

    const email = await fetchEmail(identity!.email, identity!.email_password, true, uuid!);
    return {uuid, fetchEmail: email};
  })
  .post('/send-email/:id', async ({set, identity, body}) => {
    const fields = ['to', '?inReplyTo', '?references', '?attachments', 'subject', 'body'];
    const {err, to, inReplyTo, references, attachments, subject, body: emailBody, draft} = await checkAPI(body, fields);
    if (err) return error(set, 400, err);

    const email = identity!.email;
    const password = identity!.email_password;
    const flatReferences = Array.isArray(references) ? references.flat(Infinity) : references;
    const content = {email, password, to, subject, body: emailBody, attachments, references: flatReferences, inReplyTo};

    const response = await sendIdentityEmail(content);
    if (!response.messageID) return error(set, 400, 'Failed to send email');
    const fullEmail = {...content, messageID: response.messageID, date: response.date};

    let uid;
    let warning;
    try {
      uid = (await appendToMailbox(false, fullEmail)).uid;
      if (draft) await deleteEmail(email, password, 'Drafts', (body as APIRequest).draft);
    } catch {
      warning = 'Email was sent, but saving it in Sent or removing its draft failed. Do not resend it.';
    }

    delete (fullEmail as {password?: string}).password;

    const sentEmail = {...fullEmail, uid, type: response.type};
    return {draft, sentEmail, warning};
  })
  .post('/forward-email/:id', async ({set, identity, body}) => {
    const {err, uid, forward} = await checkAPI(body, ['uid', 'forward']);
    if (err) return error(set, 400, err);

    const email = await fetchEmail(identity!.email, identity!.email_password, false, uid!);
    if (!email) return error(set, 400, 'Failed to fetch email');

    if (email.type === 'html') {
      const escape = (value: unknown) =>
        String(value ?? '').replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char]!);
      email.body = `
      <p><strong>--- Forwarded Message ---</strong></p>
      <p><strong>From:</strong> ${escape(email.from)}</p>
      <p><strong>To:</strong> ${escape(forward)}</p>
      <p><strong>Subject:</strong> ${escape(email.subject)}</p>
      <p><strong>Date:</strong> ${escape(email.date)}</p>
      <p><strong>Subject:</strong> ${escape(email.subject)}</p>
      <p>${email.body}</p>
    `;
    } else {
      email.body = `
      --- Forwarded Message ---
      From: ${email.from}
      To: ${forward}
      Subject: ${email.subject}
      Date: ${email.date}
      Subject: ${email.subject}

      ${email.body}
    `;
    }

    email.subject = email.subject!.toUpperCase().includes('FWD: ') ? email.subject : `FWD: ${email?.subject}`;
    const forwardContent = {...email, to: forward, email: identity!.email, password: identity!.email_password};

    const response = await sendIdentityEmail(forwardContent as EmailContent);
    if (!response.messageID) return error(set, 400, 'Failed to forward email');

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
  .put('/save-draft/:id', async ({set, identity, body}) => {
    const fields = ['to', '?inReplyTo', '?references', '?attachments', 'subject', 'body'];
    const {err, to, inReplyTo, references, attachments, subject, body: emailBody, draft} = await checkAPI(body, fields);
    if (err) return error(set, 400, err);

    const email = identity!.email;
    const password = identity!.email_password;
    const flatReferences = Array.isArray(references) ? references.flat(Infinity) : references;
    const content = {email, password, to, subject, body: emailBody, attachments, references: flatReferences, inReplyTo};

    const fullEmail = await appendToMailbox(true, content);
    if (draft) await deleteEmail(email, password, 'Drafts', (body as APIRequest).draft);

    delete (fullEmail as {password?: string}).password;
    delete (fullEmail as {email?: string}).email;

    const {password: _password, email: _email, ...safeContent} = content;
    const savedDraft = {...fullEmail, ...safeContent};
    return {draft, savedDraft};
  })
  .delete('/delete-email/:id', async ({set, identity, body}) => {
    const {err, mailbox, uid} = await checkAPI(body, ['mailbox', 'uid']);
    if (err) return error(set, 400, err);

    await deleteEmail(identity!.email, identity!.email_password, mailbox!, (body as APIRequest).uid!);
    return {mailbox, uid};
  });
