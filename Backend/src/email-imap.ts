import PostalMime from 'postal-mime';
import imap from 'imap-simple';
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
        const parts = imap.getParts(message.attributes.struct!);

        const rawAttachments = parts.filter(function (part) {
          return part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
        });

        const attachments = await Promise.all(
          rawAttachments.map((part) =>
            connection.getPartData(message, part).then((partData) => ({
              filename: part.disposition.params.filename,
              data: partData.toString('base64'),
            })),
          ),
        );

        const details = message.parts[0].body;
        const rawBody = message.parts[1].body;
        const type = /<\/?(html|body|head)>/.test(rawBody) ? 'html' : 'text';

        await connection.addFlags(message.attributes.uid, ['\\SEEN']);

        const email = await PostalMime.parse(rawBody);
        const cleanedBody = (email.html || email.text)!.match(/<html[^>]*>(.*?)<\/html>/is);
        const body = mimelib.decodeQuotedPrintable(cleanedBody?.[0] || email.html || email.text!);

        ws.send(
          JSON.stringify({
            type: 'new-email',
            newEmail: {
              messageID: details['message-id'][0],
              subject: details.subject[0],
              from: details.from[0],
              date: details.date[0],
              reference: details.references?.[0],
              inReplyTo: details['in-reply-to']?.[0],
              attachments,
              body,
              type,
            },
          }),
        );
      }
    },
  };

  const connection = await imap.connect(config);
  connection.openBox('INBOX');
}

export async function fetchEmails(user: string, password: string, from?: number, to?: number) {
  const config = {
    imap: {
      user,
      password,
      host: 'mail.shadowself.io',
      port: 993,
      tls: true,
    },
  };

  const total = [];
  const connection = await imap.connect(config);
  const messagesCount = await getMessageCount(connection);

  const mesFrom = from || messagesCount - 20;
  const mesTo = to || messagesCount;

  await connection.openBox('INBOX');
  const messages = await connection.search([`${mesFrom}:${mesTo}`], {
    bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)', 'TEXT'],
    struct: true,
  });

  for (const message of messages) {
    const parts = imap.getParts(message.attributes.struct!);

    const rawAttachments = parts.filter(function (part) {
      return part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
    });

    const attachments = await Promise.all(
      rawAttachments.map((part) =>
        connection.getPartData(message, part).then((partData) => ({
          filename: part.disposition.params.filename,
          data: partData.toString('base64'),
        })),
      ),
    );

    const details = message.parts[0].body;
    const rawBody = message.parts[1].body;
    const type = /<\/?(html|body|head)>/.test(rawBody) ? 'html' : 'text';

    const email = await PostalMime.parse(rawBody);
    const cleanedBody = (email.html || email.text)!.match(/<html[^>]*>(.*?)<\/html>/is);
    const body = mimelib.decodeQuotedPrintable(cleanedBody?.[0] || email.html || email.text!);

    total.push({
      messageID: details['message-id'][0],
      subject: details.subject[0],
      from: details.from[0],
      date: details.date[0],
      reference: details.references?.[0],
      inReplyTo: details['in-reply-to']?.[0],
      attachments,
      body,
      type,
    });
  }

  connection.end();
  return {messagesCount, total: total.reverse()};
}

async function getMessageCount(connection: imap.ImapSimple) {
  return new Promise<number>((resolve, reject) => {
    connection.imap.status('INBOX', (err, mes) => {
      if (err) reject(err);
      else resolve(mes.messages.total);
    });
  });
}
