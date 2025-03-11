import {imapConnection} from './connection';
import {EmailContent} from './types.ts';
import PostalMime from 'postal-mime';
import imap from 'imap-simple';
// @ts-expect-error No declaration file
import mimelib from 'mimelib';

export async function listenForEmail(ws: WebSocket, user: string, password: string) {
  async function onmail(mail: number) {
    if (mail > 1) return;

    await connection.openBox('INBOX');
    const messages = await connection.search([`UNSEEN`], {
      bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)', 'TEXT'],
      struct: true,
    });

    for (const message of messages) {
      const response = await parseMassage(connection, message);
      ws.send(JSON.stringify({type: 'new-email', newEmail: response}));
    }
  }

  const connection = await imapConnection(user, password, onmail);
  connection.openBox('INBOX');

  ws.onclose = () => connection.end();
}

export async function deleteEmail(user: string, password: string, mailbox: string, uid: number) {
  const connection = await imapConnection(user, password);
  await connection.openBox(mailbox);
  await connection.moveMessage(uid.toString(), 'Junk');
  connection.end();
}

export async function fetchReply(user: string, password: string, messageID?: string) {
  const connection = await imapConnection(user, password);
  let reply = null;

  for (const mailbox of ['INBOX', 'Sent']) {
    await connection.openBox(mailbox);

    const message = await connection.search([['HEADER', 'MESSAGE-ID', messageID]], {
      bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)', 'TEXT'],
      struct: true,
    });

    if (message.length === 0) continue;
    reply = await parseMassage(connection, message[0]);
  }

  connection.end();
  return reply;
}

export async function fetchMoreEmails(user: string, password: string, mailbox: string, from: number) {
  if (from < 0) return [];
  const connection = await imapConnection(user, password);
  const query = from - 7 < 0 ? `${1}:${from}` : `${from - 6}:${from}`;
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

export async function appendToMailbox(content: EmailContent & {messageID: string; date: string}) {
  const connection = await imapConnection(content.email, content.password);
  await connection.openBox('Sent');
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
    bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)', 'TEXT'],
    struct: true,
  });

  for (const message of messages) {
    await connection.addFlags(message.attributes.uid, ['\\SEEN']);
    if (inbox === 'Junk') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const internalDate = new Date(message.attributes.date);

      if (internalDate < sevenDaysAgo) {
        await connection.deleteMessage(message.attributes.uid);
        continue;
      }
    }

    emails.unshift(await parseMassage(connection, message));
  }

  return {messagesCount, emails};
}

async function parseMassage(connection: imap.ImapSimple, message: imap.Message) {
  const parts = imap.getParts(message.attributes.struct!);

  const rawAttachments = parts.filter(
    ({disposition}) => disposition && disposition.type.toUpperCase() === 'ATTACHMENT' && !disposition.params.filename.includes('.asc'),
  );

  const attachments = await Promise.all(
    rawAttachments.map((part) =>
      connection.getPartData(message, part).then((partData) => {
        return {
          filename: part.disposition.params.filename,
          data: partData.toString('base64'),
        };
      }),
    ),
  );

  if (!message.attributes.flags.includes('\\Seen')) {
    await connection.addFlags(message.attributes.uid, ['\\Seen']);
  }

  const uid = message.attributes.uid;
  const details = message.parts[0].body;
  const rawBody = message.parts[1].body;

  const email = await PostalMime.parse(rawBody);
  const cleanedBody = (email.html || email.text || '')!.match(/<html[^>]*>(.*?)<\/html>/is);
  let body = mimelib.decodeQuotedPrintable(cleanedBody?.[1] || email.html || email.text! || '');
  const type = /<\/?(html|body|head|title|div|p|span|a|img)>/.test(body) ? 'html' : 'text';

  if (details.from[0].includes('@gmail.com')) {
    body = body.match(/<div[^>]*>(.*?)<\/div>/is)[0] || body;
  }

  return {
    messageID: details['message-id'][0],
    subject: details.subject[0],
    from: details.from[0],
    date: details.date[0],
    reference: details.references?.[0],
    inReplyTo: details['in-reply-to']?.[0],
    attachments,
    uid,
    body,
    type,
  };
}
