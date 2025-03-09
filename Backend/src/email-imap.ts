import PostalMime from 'postal-mime';
import imap from 'imap-simple';
// @ts-expect-error No declaration file
import mimelib from 'mimelib';

export async function listenForEmail(ws: WebSocket, user: string, password: string) {
  const config = {
    imap: {
      user,
      password,
      host: 'mail.shadowself.io',
      port: 993,
      tls: true,
    },

    onmail: async (mail: number) => {
      if (mail > 1) return;

      await connection.openBox('INBOX');
      const messages = await connection.search([`UNSEEN`], {
        bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)', 'TEXT'],
        struct: true,
      });

      for (const message of messages) {
        await connection.addFlags(message.attributes.uid, ['\\SEEN']);
        const {messageID, subject, from, date, reference, inReplyTo, attachments, body, type} = await parseMassage(
          connection,
          message,
        );

        ws.send(
          JSON.stringify({
            type: 'new-email',
            newEmail: {messageID, subject, from, date, reference, inReplyTo, attachments, body, type},
          }),
        );
      }
    },
  };

  const connection = await imap.connect(config);
  connection.openBox('INBOX');

  ws.onclose = () => connection.end();
}

export async function fetchEmail(user: string, password: string, type: string, query?: string) {
  const config = {
    imap: {
      user,
      password,
      host: 'mail.shadowself.io',
      port: 993,
      tls: true,
    },
  };

  const connection = await imap.connect(config);
  const mailbox = await getInbox(type === 'send' ? 'Sent' : 'INBOX', connection, query);
  connection.end();

  return {
    sendMessagesCount: mailbox.messagesCount,
    send: mailbox.emails,
  };
}

export async function fetchRecentEmails(user: string, password: string) {
  const config = {
    imap: {
      user,
      password,
      host: 'mail.shadowself.io',
      port: 993,
      tls: true,
    },
  };

  const connection = await imap.connect(config);

  const inboxMailbox = await getInbox('INBOX', connection);
  const sendMailbox = await getInbox('Sent', connection);
  const draftMailbox = await getInbox('Drafts', connection);
  const junkMailbox = await getInbox('Junk', connection);
  connection.end();

  return {
    messagesCount: inboxMailbox.messagesCount,
    sendMessagesCount: sendMailbox.messagesCount,
    draftMessagesCount: draftMailbox.messagesCount,
    junkMessagesCount: junkMailbox.messagesCount,
    inbox: inboxMailbox.emails,
    send: sendMailbox.emails,
    draft: draftMailbox.emails,
    junk: junkMailbox.emails,
  };
}

async function getInbox(inbox: string, connection: imap.ImapSimple, query?: string) {
  const emails = [];
  const messagesCount = await getMessageCount(inbox, connection);

  await connection.openBox(inbox);
  const lastMessages = messagesCount - 10 < 0 ? 1 : messagesCount - 9;
  const searchQuery = query ? query : `${lastMessages}:${messagesCount || 1}`;

  const messages = await connection.search([searchQuery], {
    bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)', 'TEXT'],
    struct: true,
  });

  for (const message of messages) {
    emails.unshift(await parseMassage(connection, message));
  }

  return {messagesCount, emails};
}

async function getMessageCount(inbox: string, connection: imap.ImapSimple) {
  return new Promise<number>((resolve, reject) => {
    connection.imap.status(inbox, (err, mes) => {
      if (err) reject(err);
      else resolve(mes.messages.total);
    });
  });
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

  const details = message.parts[0].body;
  const rawBody = message.parts[1].body;

  const email = await PostalMime.parse(rawBody);
  const cleanedBody = (email.html || email.text)!.match(/<html[^>]*>(.*?)<\/html>/is);
  const body = mimelib.decodeQuotedPrintable(cleanedBody?.[1] || email.html || email.text!);
  const type = /<\/?(html|body|head|title|div|p|span|a|img)>/.test(body) ? 'html' : 'text';

  return {
    messageID: details['message-id'][0],
    subject: details.subject[0],
    from: details.from[0],
    date: details.date[0],
    reference: details.references?.[0],
    inReplyTo: details['in-reply-to']?.[0],
    attachments,
    body,
    type,
  };
}
