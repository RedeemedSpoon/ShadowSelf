import {EMAIL_FETCH_LIMIT, EMAIL_JUNK_RETENTION_DAYS} from '@core/constants';
import MailComposer from 'nodemailer/lib/mail-composer';
import {imapConnection} from '@core/services';
import {wsConnections} from '@core/states';
import {simpleParser} from 'mailparser';
import type {EmailContent} from '@type';
import imap from 'imap-simple';
import {randomUUID} from 'node:crypto';

export async function listenForEmail(user: string, password: string): Promise<imap.ImapSimple | null> {
  let connection: imap.ImapSimple | null = null;

  async function onmail(mail: number) {
    if (mail < 1 || !connection) return;

    await connection.openBox('INBOX');
    const messages = await connection.search([`UNSEEN`], {bodies: ['']});

    for (const message of messages) {
      const email = await parseMassage(connection, message);

      const sockets = wsConnections.values().filter((ws) => ws.emailAddress === user);
      for (const ws of sockets) {
        if (await ws.authorize()) ws.websocket.send(JSON.stringify({type: 'email', email}));
      }
    }
  }

  async function connect(retries = 3) {
    const sockets = [...wsConnections.values()].filter((ws) => ws.emailAddress === user);

    if (!sockets.length || retries <= 0) return;

    try {
      connection?.end();
      connection = await imapConnection(user, password, onmail);
      await connection.openBox('INBOX');

      sockets.forEach((ws) => (ws.imapConnection = connection!));

      connection.on('error', () => {});
      connection.once('end', () => setTimeout(() => connect(3), 5000));
    } catch (_) {
      setTimeout(() => connect(retries - 1), 5000);
    }
  }
  await connect();
  return connection;
}

export async function fetchMoreEmails(user: string, password: string, mailbox: string, since: number) {
  if (!Number.isInteger(since) || since <= 1) return [];
  const connection = await imapConnection(user, password);
  let inbox;

  try {
    const start = Math.max(1, since - EMAIL_FETCH_LIMIT);
    const query = `${start}:${since - 1}`;
    inbox = await getInbox(mailbox, connection, query);
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
      reply = await parseMassage(connection, message[0]);
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
    await connection.moveMessage(uid.toString(), 'Junk');
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

async function getInbox(inbox: string, connection: imap.ImapSimple, query?: string) {
  const messagesCount = await getMessageCount(inbox, connection);
  if (messagesCount === 0) return {messagesCount: 0, emails: []};

  await connection.openBox(inbox);
  const lastMessages = Math.max(1, messagesCount - EMAIL_FETCH_LIMIT + 1);
  const searchQuery = query ? query : `${lastMessages}:${messagesCount || 1}`;

  const messages = await connection.search([searchQuery], {bodies: ['']});

  const emails: any[] = [];
  for (const message of messages) {
    if (inbox === 'Junk') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - EMAIL_JUNK_RETENTION_DAYS);
      const internalDate = new Date(message.attributes.date);

      if (internalDate < cutoffDate) {
        await connection.deleteMessage(message.attributes.uid);
        continue;
      }
    }

    emails.unshift(await parseMassage(connection, message));
  }

  return {messagesCount, emails};
}

async function parseMassage(connection: imap.ImapSimple, message: imap.Message) {
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
