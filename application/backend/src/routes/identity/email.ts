import {fetchRecentEmails, appendToMailbox, deleteEmail, fetchEmail, fetchMoreEmails} from '@utils/email-imap';
import {sendIdentityEmail} from '@utils/email-smtp';
import middleware from '@middleware-api';
import {checkAPI} from '@utils/checks';
import {error} from '@utils/utils';
import {APIRequest} from '@types';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/email'})
  .use(middleware)
  .get('/:id', async ({identity}) => {
    const emails = await fetchRecentEmails(identity!.email, identity!.email_password);
    return {emails};
  })
  .get('/load-more/:id', async ({set, identity, query}) => {
    const {err, mailbox, since} = await checkAPI(query, ['mailbox', 'since']);
    if (err) return error(set, 400, err);

    const nextEmails = await fetchMoreEmails(identity!.email, identity!.email_password, mailbox!, since!);
    return {mailbox, since, nextEmails};
  })
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
    const content = {email, password, to, subject, body: emailBody, attachments, references, inReplyTo};

    const response = await sendIdentityEmail(content);
    if (!response.messageID) return error(set, 400, 'Failed to send email');
    const fullEmail = {...content, messageID: response.messageID, date: response.date};

    const {uid} = await appendToMailbox(false, fullEmail);
    if (draft) await deleteEmail(email, password, 'Drafts', (body as APIRequest).draft);

    delete (fullEmail as {password?: string}).password;

    const sentEmail = {...fullEmail, uid, type: response.type};
    return {draft, sentEmail};
  })
  .post('/forward-email/:id', async ({set, identity, body}) => {
    const {err, uid, forward} = await checkAPI(body, ['uid', 'forward']);
    if (err) return error(set, 400, err);

    const email = await fetchEmail(identity!.email, identity!.email_password, false, uid!);
    if (!email) return error(set, 400, 'Failed to fetch email');

    if (email.type === 'html') {
      email.body = `
      <p><strong>--- Forwarded Message ---</strong></p>
      <p><strong>From:</strong> ${email.from}</p>
      <p><strong>To:</strong> ${forward}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>Date:</strong> ${email.date}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
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

    email.subject = email.subject.toUpperCase().includes('FWD: ') ? email.subject : `FWD: ${email?.subject}`;
    let forwardEmail = {...email, to: forward, email: identity!.email, password: identity!.email_password};

    const response = await sendIdentityEmail(forwardEmail);
    if (!response.messageID) return error(set, 400, 'Failed to forward email');

    const fullEmail = {...forwardEmail, messageID: response.messageID, date: response.date};
    const newUID = await appendToMailbox(false, fullEmail);

    delete (fullEmail as {password?: string}).password;
    delete (fullEmail as {email?: string}).email;

    forwardEmail = {...fullEmail, uid: newUID.uid, type: response.type};
    return {uid, forward, forwardEmail};
  })
  .put('/save-draft/:id', async ({set, identity, body}) => {
    const fields = ['to', '?inReplyTo', '?references', '?attachments', 'subject', 'body'];
    const {err, to, inReplyTo, references, attachments, subject, body: emailBody, draft} = await checkAPI(body, fields);
    if (err) return error(set, 400, err);

    const email = identity!.email;
    const password = identity!.email_password;
    const content = {email, password, to, subject, body: emailBody, attachments, references, inReplyTo};

    if (draft) await deleteEmail(email, password, 'Drafts', (body as APIRequest).draft);
    const fullEmail = await appendToMailbox(true, content);

    delete (fullEmail as {password?: string}).password;
    delete (fullEmail as {email?: string}).email;

    const savedDraft = {...fullEmail, ...content};
    return {draft, savedDraft};
  })
  .delete('/delete-email/:id', async ({set, identity, body}) => {
    const {err, mailbox, uid} = await checkAPI(body, ['mailbox', 'uid']);
    if (err) return error(set, 400, err);

    await deleteEmail(identity!.email, identity!.email_password, mailbox!, (body as APIRequest).uid!);
    return {mailbox, uid};
  });
