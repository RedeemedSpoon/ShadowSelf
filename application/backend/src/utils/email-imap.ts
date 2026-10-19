import {EMAIL_FETCH_LIMIT, EMAIL_UID_WINDOW} from '@core/constants';
import MailComposer from 'nodemailer/lib/mail-composer';
import {imapConnection} from '@core/services';
import {wsConnections} from '@core/states';
import {simpleParser} from 'mailparser';
import type {EmailContent, Mailbox} from '@type';
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
        if (stopped || active !== connection || !active || lastUID === undefined) {
          return;
        }

        const messages = await active.search([['UID', `${lastUID + 1}:*`]], {
          bodies: ['HEADER.FIELDS (MESSAGE-ID SUBJECT FROM TO DATE IN-REPLY-TO REFERENCES)'],
          markSeen: false,
        });

        for (const message of messages) {
          if (message.attributes.uid <= lastUID) {
            continue;
          }

          const email = await parseEnvelope(message, 'INBOX');

          const socket = wsConnections.get(socketID);

          if (stopped || active !== connection || !socket || !(await socket.authorize())) {
            return;
          }

          socket.websocket.send(JSON.stringify({type: 'email', email}));
          lastUID = message.attributes.uid;
        }
      })
      .catch(() => active?.end());
  };

  const connect = async () => {
    if (stopped) {
      return;
    }

    try {
      const active = await imapConnection(user, password, queueMail);

      if (stopped) {
        return active.end();
      }

      connection = active;

      const schedule = () => {
        if (connection !== active) {
          return;
        }

        connection = null;
        active.end();

        if (!stopped) {
          reconnect = setTimeout(() => void connect(), 5000);
        }
      };
      active.once('end', schedule);
      active.once('error', schedule);

      const mailbox = await new Promise<{uidnext: number; uidvalidity: number}>((resolve, reject) => {
        active.imap.openBox('INBOX', (error, box) => (error ? reject(error) : resolve(box)));
      });

      if (lastUID === undefined) {
        lastUID = mailbox.uidnext - 1;
      } else {
        if (uidValidity !== mailbox.uidvalidity) {
          lastUID = 0;
        }
      }

      uidValidity = mailbox.uidvalidity;
      queueMail();
    } catch {
      connection?.end();
      connection = null;
      clearTimeout(reconnect);

      if (!stopped) {
        reconnect = setTimeout(() => void connect(), 5000);
      }
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

export function createMailReader(connect = imapConnection) {
  async function withConnection<T>(
    user: string,
    password: string,
    action: (connection: imap.ImapSimple) => Promise<T>,
  ) {
    const connection = await connect(user, password);

    try {
      return await action(connection);
    } finally {
      connection.end();
    }
  }

  return {
    list(user: string, password: string, mailbox: Mailbox, before?: number) {
      return withConnection(user, password, (connection) => listMailbox(connection, mailbox, before));
    },
    message(
      user: string,
      password: string,
      mailbox: Mailbox,
      uid: number,
      markRead = true,
      includeAttachments = false,
    ) {
      return withConnection(user, password, async (connection) => {
        await connection.openBox(mailbox);

        const messages = await connection.search([['UID', uid]], {bodies: ['HEADER'], struct: true, markSeen: false});
        const message = messages.find((message) => message.attributes.uid === uid);

        if (!message) {
          return null;
        }

        const email = await parseMessage(connection, message, mailbox, includeAttachments);

        if (markRead && !email.read) {
          await connection.addFlags(uid, ['\\Seen']);
          email.read = true;
        }

        return email;
      });
    },
    attachment(user: string, password: string, mailbox: Mailbox, uid: number, index: number) {
      return withConnection(user, password, async (connection) => {
        await connection.openBox(mailbox);

        const messages = await connection.search([['UID', uid]], {bodies: ['HEADER'], struct: true, markSeen: false});
        const message = messages.find((message) => message.attributes.uid === uid);
        const part = message && attachmentParts(message)[index];

        if (!message || !part) {
          return null;
        }

        return {
          ...attachmentMetadata(part, index),
          data: Buffer.from(await connection.getPartData(message, part)).toString('base64'),
        };
      });
    },
    reply(user: string, password: string, messageID: string) {
      return withConnection(user, password, async (connection) => {
        for (const mailbox of ['INBOX', 'Sent'] as const) {
          await connection.openBox(mailbox);

          const messages = await connection.search([['HEADER', 'MESSAGE-ID', messageID]], {
            bodies: ['HEADER'],
            struct: true,
            markSeen: false,
          });

          for (const message of messages) {
            const email = await parseMessage(connection, message, mailbox);

            if (email.messageID === messageID) {
              return email;
            }
          }
        }

        return null;
      });
    },
  };
}

export const mailReader = createMailReader();

export async function appendToMailbox(asDraft: boolean, content: EmailContent, connect = imapConnection) {
  const connection = await connect(content.email, content.password);

  try {
    await connection.openBox(asDraft ? 'Drafts' : 'Sent');

    const date = content.date || new Date();
    const messageID = content.messageID || `<${randomUUID()}@${content.email.split('@')[1]}>`;
    const type = content.type;

    if (!asDraft) {
      const existing = await connection.search([['HEADER', 'MESSAGE-ID', messageID]], {
        bodies: ['HEADER.FIELDS (MESSAGE-ID)'],
        markSeen: false,
      });

      for (const message of existing) {
        if ((await parseEnvelope(message, 'Sent')).messageID === messageID) {
          return {uid: message.attributes.uid, date, messageID, type};
        }
      }
    }

    const attachments = (content.attachments || []).map((attachment) => ({
      filename: attachment.filename,
      contentType: attachment.contentType,
      cid: attachment.cid,
      content: attachment.data,
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

    const existing = await connection.search([['HEADER', 'MESSAGE-ID', messageID]], {
      bodies: ['HEADER.FIELDS (MESSAGE-ID)'],
    });

    if (existing.length) {
      return {uid: existing[0].attributes.uid, date, messageID, type};
    }

    await connection.append(await mail.compile().build(), {flags: asDraft ? ['\\Seen', '\\Draft'] : ['\\Seen']});

    const messages = await connection.search([['HEADER', 'MESSAGE-ID', messageID]], {
      bodies: ['HEADER.FIELDS (MESSAGE-ID)'],
    });

    if (!messages[0]) {
      throw new Error('Saved message could not be located');
    }

    return {uid: messages[0].attributes.uid, date, messageID, type};
  } finally {
    connection.end();
  }
}

export async function deleteEmail(user: string, password: string, mailbox: string, uid: number) {
  const connection = await imapConnection(user, password);

  try {
    await connection.openBox(mailbox);

    if (mailbox === 'Junk') {
      await connection.deleteMessage(uid);
    } else {
      await connection.moveMessage(uid.toString(), 'Junk');
    }
  } finally {
    connection.end();
  }
}

async function searchIDs(connection: imap.ImapSimple, criteria: any[]) {
  return new Promise<number[]>((resolve, reject) => {
    connection.imap.search(criteria, (error, ids) => (error ? reject(error) : resolve(ids)));
  });
}

async function listMailbox(connection: imap.ImapSimple, mailbox: Mailbox, before?: number) {
  const box = await new Promise<{uidnext: number; messages: {total: number}}>((resolve, reject) => {
    connection.imap.openBox(mailbox, (error, box) => {
      if (error) {
        reject(error);
      } else {
        resolve(box);
      }
    });
  });
  const upper = Math.min(before === undefined ? box.uidnext : before, box.uidnext) - 1;
  const lower = Math.max(1, upper - EMAIL_UID_WINDOW + 1);
  const ids = upper >= lower ? await searchIDs(connection, [['UID', `${lower}:${upper}`]]) : [];
  const selected = ids.sort((a, b) => a - b).slice(-EMAIL_FETCH_LIMIT);
  const nextCursor = ids.length > selected.length ? selected[0] : lower > 1 ? lower : null;

  if (!selected.length) {
    return {mailbox, messages: [], messagesCount: box.messages.total, nextCursor, complete: nextCursor === null};
  }

  const results = await connection.search([['UID', selected.join(',')]], {
    bodies: ['HEADER.FIELDS (MESSAGE-ID SUBJECT FROM TO DATE IN-REPLY-TO REFERENCES)'],
    markSeen: false,
  });
  const messages = await Promise.all(results.map((message) => parseEnvelope(message, mailbox)));
  messages.sort((a, b) => b.uid - a.uid);

  return {
    mailbox,
    messages,
    messagesCount: box.messages.total,
    nextCursor,
    complete: nextCursor === null,
  };
}

async function parseEnvelope(message: imap.Message, mailbox: Mailbox) {
  const part = message.parts.find((part) => part.which.startsWith('HEADER'));
  const raw =
    typeof part?.body === 'string'
      ? part.body
      : Object.entries(part?.body || {})
          .map(([key, values]) => `${key}: ${(values as string[]).join(', ')}`)
          .join('\r\n');
  const email = await simpleParser(raw);
  const to = Array.isArray(email.to) ? email.to.map((item) => item.text).join(', ') : email.to?.text;

  return {
    mailbox,
    uid: message.attributes.uid,
    messageID: email.messageId || null,
    subject: email.subject || '',
    from: email.from?.text || '',
    to: to || '',
    date: email.date || message.attributes.date,
    read: message.attributes.flags.includes('\\Seen'),
  };
}

function attachmentParts(message: imap.Message) {
  return imap.getParts(message.attributes.struct || []).filter((part) => {
    return (
      part.disposition?.type?.toUpperCase() === 'ATTACHMENT' ||
      part.disposition?.type?.toUpperCase() === 'INLINE' ||
      part.type !== 'text'
    );
  });
}

function attachmentMetadata(part: any, index: number) {
  return {
    index,
    filename: part.disposition?.params?.filename || part.params?.name || 'attachment',
    cid: part.id || undefined,
    contentType: `${part.type}/${part.subtype}`,
  };
}

async function parseMessage(
  connection: imap.ImapSimple,
  message: imap.Message,
  mailbox: Mailbox,
  includeAttachments = false,
) {
  const summary = await parseEnvelope(message, mailbox);
  const header = message.parts.find((part) => part.which.startsWith('HEADER'))?.body;
  const raw =
    typeof header === 'string'
      ? header
      : Object.entries(header || {})
          .map(([key, values]) => `${key}: ${(values as string[]).join(', ')}`)
          .join('\r\n');
  const email = await simpleParser(raw);
  const parts = imap.getParts(message.attributes.struct || []);
  const files = attachmentParts(message);
  const bodyParts = parts.filter(
    (part) => part.type === 'text' && !files.includes(part) && ['html', 'plain'].includes(part.subtype),
  );
  const htmlParts = bodyParts.filter((part) => part.subtype === 'html');
  const selected = htmlParts.length ? htmlParts : bodyParts;
  const bodies: string[] = [];

  for (const part of selected) {
    const data = await connection.getPartData(message, part);

    if (Buffer.isBuffer(data)) {
      const content = Buffer.concat([
        Buffer.from(`Content-Type: text/${part.subtype}; charset=${part.params?.charset || 'utf-8'}\r\n\r\n`),
        data,
      ]);
      const parsed = await simpleParser(content);
      bodies.push(part.subtype === 'html' ? parsed.html || '' : parsed.text || '');
    } else {
      bodies.push(String(data));
    }
  }

  const attachments = [];

  for (const [index, part] of files.entries()) {
    const data = includeAttachments
      ? Buffer.from(await connection.getPartData(message, part)).toString('base64')
      : undefined;
    attachments.push({...attachmentMetadata(part, index), data});
  }

  return {
    ...summary,
    inReplyTo: email.inReplyTo || null,
    references:
      typeof email.references === 'string' ? email.references.split(/\s+/).filter(Boolean) : email.references || [],
    attachments,
    body: bodies.join('\n'),
    type: htmlParts.length ? ('html' as const) : ('text' as const),
  };
}
