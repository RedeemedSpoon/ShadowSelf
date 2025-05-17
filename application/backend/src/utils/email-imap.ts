import {imapConnection, WSConnections} from './connection';
import MailComposer from 'nodemailer/lib/mail-composer';
import PostalMime from 'postal-mime';
import {EmailContent} from '@types';
import imap from 'imap-simple';
// @ts-expect-error No declaration file
import mimelib from 'mimelib';

export async function listenForEmail(user: string, password: string) {
  async function onmail(mail: number) {
    if (mail > 1) return;

    await connection.openBox('INBOX');
    const messages = await connection.search([`UNSEEN`], {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)', 'TEXT'],
      struct: true,
    });

    for (const message of messages) {
      const email = await parseMassage(connection, message);
      const ws = WSConnections.find((ws) => ws.emailAddress === user);
      if (!ws) return;

      ws.websocket.send(JSON.stringify({type: 'email', email}));
    }
  }

  const connection = await imapConnection(user, password, onmail);
  connection.openBox('INBOX');

  return connection;
}

export async function fetchMoreEmails(user: string, password: string, mailbox: string, since: number) {
  if (since < 0) return [];
  const connection = await imapConnection(user, password);
  const query = Number(since) - 7 < 0 ? `${1}:${since}` : `${Number(since) - 6}:${since}`;
  const inbox = await getInbox(mailbox, connection, query);

  connection.end();
  return inbox.emails;
}

export async function fetchRecentEmails(user: string, password: string) {
  const connection = await imapConnection(user, password);

  const inboxMailbox = await getInbox('INBOX', connection);
  const sentMailbox = await getInbox('Sent', connection);
  const draftsMailbox = await getInbox('Drafts', connection);
  const junkMailbox = await getInbox('Junk', connection);

  connection.end();

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

  for (const mailbox of ['INBOX', 'Sent']) {
    await connection.openBox(mailbox);
    const query = isReply ? [['HEADER', 'MESSAGE-ID', uuid]] : [['UID', uuid]];

    const message = await connection.search(query, {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)', 'TEXT'],
      struct: true,
    });

    if (message.length === 0) continue;
    reply = await parseMassage(connection, message[0]);
  }

  connection.end();
  return reply;
}

export async function appendToMailbox(asDraft: boolean, content: EmailContent & {messageID?: string; date?: Date}) {
  const connection = await imapConnection(content.email, content.password);
  if (asDraft) await connection.openBox('Drafts');
  else await connection.openBox('Sent');

  const shownDate = content.date || new Date();

  const attachmentsList = content.attachments.map((attachment) => {
    return {
      filename: attachment.filename,
      content: attachment.data.split(',')[1],
      encoding: 'base64',
    };
  });

  const mail = new MailComposer({
    messageId: content.messageID,
    from: content.email,
    to: content.to,
    subject: content.subject,
    text: content.body,
    html: content.body,
    references: content.references,
    inReplyTo: content.inReplyTo,
    attachments: attachmentsList,
    date: content.date,
  });

  const RFC822Message = await mail.compile().build();
  await connection.append(RFC822Message, {flags: ['\\Seen']});

  const message = await connection.search([['SINCE', shownDate]], {
    bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)', 'TEXT'],
    struct: true,
  });

  const type = /<\/?(html|body|head|title|div|p|span|a|img)>/.test(content.body) ? 'html' : 'text';
  const messageID = message[0].parts[0].body['message-id'][0];
  const {uid, date} = message[0].attributes;

  connection.end();

  return {uid, date, messageID, type};
}

export async function deleteEmail(user: string, password: string, mailbox: string, uid: number) {
  const connection = await imapConnection(user, password);
  await connection.openBox(mailbox);
  await connection.moveMessage(uid.toString(), 'Junk');
  connection.end();
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
  const emails = [];
  const messagesCount = await getMessageCount(inbox, connection);

  await connection.openBox(inbox);
  const lastMessages = messagesCount - 7 < 0 ? 1 : messagesCount - 6;
  const searchQuery = query ? query : `${lastMessages}:${messagesCount || 1}`;

  const messages = await connection.search([searchQuery], {
    bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)', 'TEXT'],
    struct: true,
  });

  for (const message of messages) {
    if (inbox === 'Junk') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const internalDate = new Date(message.attributes.date);

      if (internalDate < sevenDaysAgo) {
        await connection.deleteMessage(message.attributes.uid);
        continue;
      }
    }

    try {
      emails.unshift(await parseMassage(connection, message));
    } catch {
      continue;
    }
  }

  return {messagesCount, emails};
}

async function parseMassage(connection: imap.ImapSimple, message: imap.Message) {
  const parts = imap.getParts(message.attributes.struct!);

  let attachments =
    parts.filter(({disposition}) => {
      if (!disposition) return false;

      const isAttachment = disposition.type.toUpperCase() === 'ATTACHMENT';
      const isNotAscFile = disposition.params.filename && !disposition.params.filename.includes('.asc');

      return isAttachment && isNotAscFile;
    }) || [];

  try {
    attachments = await Promise.all(
      attachments.map((part) =>
        connection.getPartData(message, part).then((partData) => ({
          filename: part.disposition.params.filename,
          data: partData.toString('base64'),
        })),
      ),
    );
  } catch {
    // ignore this please
  }

  if (!message.attributes.flags.includes('\\Seen')) {
    await connection.addFlags(message.attributes.uid, ['\\Seen']);
  }

  const uid = message.attributes.uid;
  const details = message.parts[0].body;
  const rawBody = message.parts[1].body;

  const email = await PostalMime.parse(rawBody);
  const cleanedBody = (email.html || email.text || rawBody)!.match(/<html[^>]*>(.*?)<\/html>/is);
  let body = mimelib.decodeQuotedPrintable(cleanedBody?.[1] || email.html || email.text! || rawBody);
  const type = /<\/?(html|body|head|title|div|p|span|a|img)>/.test(body) ? 'html' : 'text';

  if (details.from[0].includes('@gmail.com')) {
    body = body.match(/<div[^>]*>(.*?)<\/div>/is)[0] || body;
  }

  if (/Content-Type:/i.test(body) && /----/i.test(body)) {
    body = body.replace(/----.*/s, '').trim();
  }

  return {
    messageID: details['message-id'][0],
    subject: details.subject[0],
    from: details?.from[0],
    date: details.date[0],
    to: details.to?.[0],
    references: details.references,
    inReplyTo: details['in-reply-to']?.[0],
    attachments,
    uid,
    body,
    type,
  };
}
