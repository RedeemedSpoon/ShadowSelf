import {EMAIL_FETCH_LIMIT, EMAIL_JUNK_RETENTION_DAYS} from '@core/constants';
import MailComposer from 'nodemailer/lib/mail-composer';
import {imapConnection} from '@core/services';
import {wsConnections} from '@core/states';
import {simpleParser} from 'mailparser';
import type {EmailContent} from '@type';
import imap from 'imap-simple';
import {randomUUID} from 'node:crypto';

export function listenForEmail(user: string, password: string, socketID: string) {
  let connection: imap.ImapSimple | null = null;
  let reconnect: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let lastUID: number | undefined;
  let uidValidity: number | undefined;
  let pending = Promise.resolve();

  const queueMail = () => {
    const active = connection;
    pending = pending
      .then(async () => {
        if (stopped || active !== connection || !active || lastUID === undefined) return;
        const messages = await active.search([['UID', `${lastUID + 1}:*`]], {bodies: ['']});
        for (const message of messages) {
          if (message.attributes.uid <= lastUID) continue;
          const email = await parseMessage(active, message);
          const socket = wsConnections.get(socketID);
          if (stopped || active !== connection || !socket || !(await socket.authorize())) return;

          socket.websocket.send(JSON.stringify({type: 'email', email}));
          lastUID = message.attributes.uid;
        }
      })
      .catch(() => active?.end());
  };

  const connect = async () => {
    if (stopped) return;
    try {
      const active = await imapConnection(user, password, queueMail);
      if (stopped) return active.end();
      connection = active;
      const schedule = () => {
        if (connection !== active) return;
        connection = null;
        active.end();
        if (!stopped) reconnect = setTimeout(() => void connect(), 5000);
      };
      active.once('end', schedule);
      active.once('error', schedule);
      const mailbox = await new Promise<{uidnext: number; uidvalidity: number}>((resolve, reject) => {
        active.imap.openBox('INBOX', (error, box) => (error ? reject(error) : resolve(box)));
      });
      if (lastUID === undefined) lastUID = mailbox.uidnext - 1;
      else if (uidValidity !== mailbox.uidvalidity) lastUID = 0;
      uidValidity = mailbox.uidvalidity;
      queueMail();
    } catch {
      connection?.end();
      connection = null;
      clearTimeout(reconnect);
      if (!stopped) reconnect = setTimeout(() => void connect(), 5000);
    }
  };

  void connect();

  return () => {
    stopped = true;
    clearTimeout(reconnect);
    connection?.end();
    connection = null;
  };
}

export async function fetchMoreEmails(user: string, password: string, mailbox: string, since: number) {
  if (!Number.isInteger(since) || since <= 1) return [];
  const connection = await imapConnection(user, password);
  let inbox;

  try {
    inbox = await getInbox(mailbox, connection, since);
  } finally {
    connection.end();
  }

  return inbox.emails;
}

export async function fetchRecentEmails(user: string, password: string) {
  const connection = await imapConnection(user, password);
  let inboxMailbox, sentMailbox, draftsMailbox, junkMailbox;

  try {
    inboxMailbox = await getInbox('INBOX', connection);
    sentMailbox = await getInbox('Sent', connection);
    draftsMailbox = await getInbox('Drafts', connection);
    junkMailbox = await getInbox('Junk', connection);
  } finally {
    connection.end();
  }

  return {
    messagesCount: inboxMailbox.messagesCount,
    sentMessagesCount: sentMailbox.messagesCount,
    draftsMessagesCount: draftsMailbox.messagesCount,
    junkMessagesCount: junkMailbox.messagesCount,
    inbox: inboxMailbox.emails,
    sent: sentMailbox.emails,
    drafts: draftsMailbox.emails,
    junk: junkMailbox.emails,
  };
}

export async function fetchEmail(user: string, password: string, isReply: boolean, uuid: string | number) {
  const connection = await imapConnection(user, password);
  let reply = null;

  try {
    for (const mailbox of ['INBOX', 'Sent']) {
      await connection.openBox(mailbox);
      const query = isReply ? [['HEADER', 'MESSAGE-ID', uuid]] : [['UID', uuid]];
      const message = await connection.search(query, {bodies: ['']});

      if (message.length === 0) continue;
      reply = await parseMessage(connection, message[0]);
    }
  } finally {
    connection.end();
  }

  return reply;
}

export async function appendToMailbox(asDraft: boolean, content: EmailContent & {messageID?: string; date?: Date}) {
  const connection = await imapConnection(content.email, content.password);

  try {
    await connection.openBox(asDraft ? 'Drafts' : 'Sent');
    const date = content.date || new Date();
    const messageID = content.messageID || `<${randomUUID()}@${content.email.split('@')[1]}>`;
    const type = /<[a-z][^>]*>/i.test(content.body) ? 'html' : 'text';
    const attachments = (content.attachments || []).map((attachment) => ({
      filename: attachment.filename,
      content: attachment.data.includes(',') ? attachment.data.split(',')[1] : attachment.data,
      encoding: 'base64',
    }));
    const mail = new MailComposer({
      messageId: messageID,
      from: content.email,
      to: content.to,
      subject: content.subject,
      ...(type === 'html' ? {html: content.body} : {text: content.body}),
      references: content.references,
      inReplyTo: content.inReplyTo,
      attachments,
      date,
    });

    await connection.append(await mail.compile().build(), {flags: asDraft ? ['\\Seen', '\\Draft'] : ['\\Seen']});
    const messages = await connection.search([['HEADER', 'MESSAGE-ID', messageID]], {bodies: ['']});
    if (!messages[0]) throw new Error('Saved message could not be located');

    return {uid: messages[0].attributes.uid, date, messageID, type};
  } finally {
    connection.end();
  }
}

export async function deleteEmail(user: string, password: string, mailbox: string, uid: number) {
  const connection = await imapConnection(user, password);

  try {
    await connection.openBox(mailbox);
    if (mailbox === 'Junk') await connection.deleteMessage(uid);
    else await connection.moveMessage(uid.toString(), 'Junk');
  } finally {
    connection.end();
  }
}

async function getMessageCount(inbox: string, connection: imap.ImapSimple) {
  return new Promise<number>((resolve, reject) => {
    connection.imap.status(inbox, (err, mes) => {
      if (err) reject(err);
      else resolve(mes.messages.total);
    });
  });
}

async function getInbox(inbox: string, connection: imap.ImapSimple, beforeUID?: number) {
  let messagesCount = await getMessageCount(inbox, connection);
  if (messagesCount === 0) return {messagesCount: 0, emails: []};

  await connection.openBox(inbox);
  const ids = await new Promise<number[]>((resolve, reject) => {
    const criteria = beforeUID ? [['UID', `1:${beforeUID - 1}`]] : ['ALL'];
    connection.imap.search(criteria, (error, ids) => (error ? reject(error) : resolve(ids)));
  });
  const selected = ids.filter((id) => !beforeUID || id < beforeUID).slice(-EMAIL_FETCH_LIMIT);
  if (!selected.length) return {messagesCount, emails: []};
  const messages = await connection.search([['UID', selected.join(',')]], {bodies: ['']});

  const emails: any[] = [];
  for (const message of messages) {
    if (inbox === 'Junk') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - EMAIL_JUNK_RETENTION_DAYS);
      const internalDate = new Date(message.attributes.date);

      if (internalDate < cutoffDate) {
        await connection.deleteMessage(message.attributes.uid);
        messagesCount--;
        continue;
      }
    }

    emails.unshift(await parseMessage(connection, message));
  }

  return {messagesCount, emails};
}

async function parseMessage(connection: imap.ImapSimple, message: imap.Message) {
  if (!message.attributes.flags.includes('\\Seen')) {
    await connection.addFlags(message.attributes.uid, ['\\Seen']);
  }

  const rawEmail = message.parts.find((part) => part.which === '')?.body;
  const email = await simpleParser(rawEmail);

  const attachments = email.attachments.map((attachment) => ({
    filename: attachment.filename || 'attachment',
    data: attachment.content.toString('base64'),
    cid: attachment.contentId,
    contentType: attachment.contentType,
  }));
  const uid = message.attributes.uid;
  const type = typeof email.html === 'string' && email.html ? 'html' : 'text';
  const body = type === 'html' ? email.html || '' : email.text || '';

  const to = email.to && Array.isArray(email.to) ? email.to.map((t) => t.text).join(', ') : email.to?.text;

  let references: string[] | undefined = undefined;
  if (email.references) {
    if (Array.isArray(email.references)) {
      references = email.references;
    } else if (typeof email.references === 'string') {
      references = email.references.split(/\s+/).filter(Boolean);
    }
  }

  return {
    messageID: email.messageId,
    subject: email.subject,
    from: email.from?.text,
    date: email.date || message.attributes.date,
    to: to?.toString(),
    inReplyTo: email.inReplyTo,
    references,
    attachments,
    uid,
    body,
    type,
  };
}
