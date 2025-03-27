import {sql, WSConnections} from '@utils/connection';
import {attempt, resizeImage} from '@utils/utils';
import {listenForEmail} from '@utils/email-imap';
import middleware from '@middleware';
import {Elysia, error} from 'elysia';
import {User} from '@types';

import card from './identity/card';
import phone from './identity/phone';
import email from './identity/email';
import account from './identity/account';
import information from './identity/information';

export default new Elysia()
  .use(middleware)
  .group('/api', (app) => app.use(card).use(phone).use(email).use(account).use(information))
  .get('/api', async ({user}) => {
    if (!user) return error(401, 'You are not logged in');

    const result = await attempt(sql` SELECT * FROM users u JOIN identities i ON u.id = i.owner WHERE u.email = ${user!.email}`);
    if (!result.length) return error(400, 'No identities were found');

    const allIdentitiesPromises = result.map(async (identity) => {
      if (!identity.name) return {};
      const {id, picture, name, location, email, phone, card} = identity;

      const lowResPic = await resizeImage(picture);
      const accounts = await attempt(sql`SELECT * FROM accounts WHERE owner = ${id}`);
      const formattedLocation = location.slice(4).trim();
      const country = location.split(',')[0];

      return {id, picture: lowResPic, name, email, phone, card, country, location: formattedLocation, accounts: accounts?.length};
    });

    return await Promise.all(allIdentitiesPromises);
  })
  .ws('/ws-api/:id', {
    async open(ws) {
      const cookie = ws.data.cookie['token'];
      if (!cookie) return ws.close(1014, 'You are not logged in');

      const user = (await ws.data.jwt.verify(cookie.value)) as User;
      if (!user?.email) return ws.close(1014, 'You are not logged in');

      const params = ws.data.params.id;
      const identity = (await attempt(sql`SELECT * FROM identities WHERE id = ${params}`))[0];
      if (!identity) return ws.close(1014, 'Identity not found. Please try again');

      const id = (await attempt(sql`SELECT id FROM users WHERE email = ${user!.email}`))[0].id;
      if (id !== identity.owner) return ws.close(1014, 'You do not authorize to perform this action');

      const connection = await listenForEmail(identity.email, identity.email_password);
      WSConnections.push({imapConnection: connection, websocket: ws, phoneNumber: identity.phone, emailAddress: identity.email});
    },

    async close(ws) {
      const connection = WSConnections.find((wss) => wss.websocket === ws);
      if (!connection) return;

      connection.imapConnection.end();
      WSConnections.splice(WSConnections.indexOf(connection), 1);
    },

    async message(ws, message: 'ping') {
      if (message === 'ping') return ws.send('pong');
    },
    // async message(ws, message: WebsocketRequest) {
    //   const params = ws.data.params.id;
    //   const identity = (await attempt(sql`SELECT * FROM identities WHERE id = ${params}`))[0];
    //
    //   switch (message.type) {
    //     case 'regenerate-picture': {
    //       const mes = { sex: identity.sex, age: identity.age, ethnicity: identity.ethnicity, bio: identity.bio };
    //       const { error, sex, age, ethnicity, bio } = await checkAPI({ ...mes, ...message });
    //       if (error) return ws.send({ error });
    //
    //       const locations = (await request('/extension-api', 'GET')) as Location[];
    //       const lang = locations.find((location) => location.code === identity.location.split(',')[0]);
    //
    //       const picture = await generateProfile(lang!, age!, sex!, ethnicity!, bio!);
    //       ws.send({ type: 'regenerate-picture', picture });
    //       break;
    //     }
    //
    //     case 'regenerate-name': {
    //       const mes = { sex: identity.sex };
    //       const { error, sex } = await checkAPI({ ...mes, ...message });
    //       if (error) return ws.send({ error });
    //
    //       const locations = (await request('/extension-api', 'GET')) as Location[];
    //       const lang = locations.find((location) => location.code === identity.location.split(',')[0]);
    //
    //       const faker = allFakers[lang?.localization as keyof typeof allFakers];
    //       const name = faker.person.fullName({ sex: sex as 'male' | 'female' });
    //
    //       ws.send({ type: 'regenerate-name', name });
    //       break;
    //     }
    //
    //     case 'regenerate-bio': {
    //       const locations = (await request('/extension-api', 'GET')) as Location[];
    //       const lang = locations.find((location) => location.code === identity.location.split(',')[0]);
    //
    //       const faker = allFakers[lang?.localization as keyof typeof allFakers];
    //       const bio = faker.person.bio();
    //
    //       ws.send({ type: 'regenerate-bio', bio });
    //       break;
    //     }
    //
    //     case 'update-information': {
    //       const mes1 = { sex: identity.sex, ethnicity: identity.ethnicity, age: identity.age };
    //       const mes2 = { name: identity.name, bio: identity.bio, picture: identity.picture };
    //       const { error, sex, ethnicity, age, name, bio, picture } = await checkAPI({ ...mes1, ...mes2, ...message });
    //       if (error) return ws.send({ error });
    //
    //       await attempt(sql`UPDATE identities SET sex = ${sex!}, ethnicity = ${ethnicity!}, age = ${age!} WHERE id = ${identity.id}`);
    //       await attempt(sql`UPDATE identities SET name = ${name!}, bio = ${bio!}, picture = ${picture!} WHERE id = ${identity.id}`);
    //
    //       ws.send({ type: 'update-information', sex, ethnicity, age, name, bio, picture });
    //       break;
    //     }
    //
    //     case 'add-account': {
    //       const { error, username, password, website, totp, algorithm } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       const res = await attempt(
    //         sql`INSERT INTO accounts (owner, username, password) VALUES (${identity.id}, ${username!}, ${password!}) RETURNING id`,
    //       );
    //
    //       if (website) await attempt(sql`UPDATE accounts SET website = ${website!} WHERE id = ${res[0].id}`);
    //       if (totp) await attempt(sql`UPDATE accounts SET totp = ${totp!}, algorithm = ${algorithm!} WHERE id = ${res[0].id!}`);
    //
    //       ws.send({ type: 'add-account', username, password, website, totp, algorithm, id: res[0].id });
    //       break;
    //     }
    //
    //     case 'edit-account': {
    //       const { error, username, password, website, totp, algorithm, id } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       await attempt(sql`UPDATE accounts SET username = ${username!}, password = ${password!} WHERE id= ${id!}`);
    //       if (website) await attempt(sql`UPDATE accounts SET website = ${website!} WHERE id = ${id!}`);
    //       if (totp) await attempt(sql`UPDATE accounts SET totp = ${totp!}, algorithm = ${algorithm!} WHERE id = ${id!}`);
    //
    //       ws.send({ type: 'edit-account', username, password, website, totp, algorithm, id });
    //       break;
    //     }
    //
    //     case 'remove-account': {
    //       const { error, id } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       await attempt(sql`DELETE FROM accounts WHERE id = ${id!}`);
    //       ws.send({ type: 'remove-account', id });
    //       break;
    //     }
    //
    //     case 'update-encryption': {
    //       if (!message.accounts || typeof message.accounts !== 'object') return ws.send({ error: 'Accounts Array are required' });
    //
    //       for (const account of message.accounts) {
    //         const { error, id, password, totp } = await checkAPI(account as WebsocketRequest);
    //         if (error) return ws.send({ error });
    //
    //         await attempt(sql`UPDATE accounts SET password = ${password!} WHERE id = ${id!}`);
    //         if (totp) await attempt(sql`UPDATE accounts SET totp = ${totp!} WHERE id = ${id!}`);
    //       }
    //
    //       ws.send({ type: 'update-encryption', accounts: message.accounts });
    //       break;
    //     }
    //
    //     case 'fetch-reply': {
    //       const { error, uuid } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       const email = await fetchEmail(identity.email, identity.email_password, true, uuid!);
    //       ws.send({ type: 'fetch-reply', uuid, fetchEmail: email });
    //       break;
    //     }
    //
    //     case 'send-email': {
    //       const { error, to, inReplyTo, references, attachments, subject, body, draft } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       const email = identity.email;
    //       const password = identity.email_password;
    //       const content = { email, password, to, subject, body, attachments, references, inReplyTo };
    //
    //       const response = await sendIdentityEmail(content);
    //       if (!response.messageID) return ws.send({ error: 'Failed to send email' });
    //       const fullEmail = { ...content, messageID: response.messageID, date: response.date };
    //
    //       const { uid } = await appendToMailbox(false, fullEmail);
    //       if (draft) await deleteEmail(email, password, 'Drafts', message.draft);
    //
    //       delete (fullEmail as { password?: string }).password;
    //       ws.send({ type: 'send-email', draft, sentEmail: { ...fullEmail, uid, type: response.type } });
    //       break;
    //     }
    //
    //     case 'save-draft': {
    //       const { error, to, inReplyTo, references, attachments, subject, body, draft } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       const email = identity.email;
    //       const password = identity.email_password;
    //       const content = { email, password, to, subject, body, attachments, references, inReplyTo };
    //
    //       if (draft) await deleteEmail(email, password, 'Drafts', message.draft);
    //       const fullEmail = await appendToMailbox(true, content);
    //
    //       delete (fullEmail as { password?: string }).password;
    //       delete (fullEmail as { email?: string }).email;
    //       ws.send({ type: 'save-draft', draft, savedDraft: { ...fullEmail, ...content } });
    //       break;
    //     }
    //
    //     case 'delete-email': {
    //       const { error, mailbox, uid } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       await deleteEmail(identity.email, identity.email_password, mailbox!, message.uid!);
    //       ws.send({ type: 'delete-email', mailbox, uid });
    //       break;
    //     }
    //
    //     case 'load-more': {
    //       const { error, mailbox, from } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       const emails = await fetchMoreEmails(identity.email, identity.email_password, mailbox!, from!);
    //       ws.send({ type: 'load-more', mailbox, from, emails });
    //       break;
    //     }
    //
    //     case 'forward-email': {
    //       const { error, uid, forward } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       const email = await fetchEmail(identity.email, identity.email_password, false, uid!);
    //       if (!email) return ws.send({ error: 'Failed to fetch email' });
    //
    //       if (email.type === 'html') {
    //         email.body = `
    //       <p><strong>--- Forwarded Message ---</strong></p>
    //       <p><strong>From:</strong> ${email.from}</p>
    //       <p><strong>To:</strong> ${forward}</p>
    //       <p><strong>Subject:</strong> ${email.subject}</p>
    //       <p><strong>Date:</strong> ${email.date}</p>
    //       <p><strong>Subject:</strong> ${email.subject}</p>
    //       <p>${email.body}</p>
    //     `;
    //       } else {
    //         email.body = `
    //       --- Forwarded Message ---
    //       From: ${email.from}
    //       To: ${forward}
    //       Subject: ${email.subject}
    //       Date: ${email.date}
    //       Subject: ${email.subject}
    //
    //       ${email.body}
    //     `;
    //       }
    //
    //       email.subject = email.subject.toUpperCase().includes('FWD: ') ? email.subject : `FWD: ${email?.subject}`;
    //       const forwardEmail = { ...email, to: forward, email: identity.email, password: identity.email_password };
    //
    //       const response = await sendIdentityEmail(forwardEmail);
    //       if (!response.messageID) return ws.send({ error: 'Failed to send email' });
    //
    //       const fullEmail = { ...forwardEmail, messageID: response.messageID, date: response.date };
    //       const newUID = await appendToMailbox(false, fullEmail);
    //
    //       delete (fullEmail as { password?: string }).password;
    //       delete (fullEmail as { email?: string }).email;
    //       ws.send({ type: 'forward-email', uid, forward, forwardEmail: { ...fullEmail, uid: newUID.uid, type: response.type } });
    //       break;
    //     }
    //
    //     case 'fetch-conversation': {
    //       const { error, addressee } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       if (addressee === identity.phone) return ws.send({ error: 'You cannot fetch your own conversation' });
    //
    //       const sentMessages = await twilio.messages.list({ to: addressee });
    //       const receivedMessages = await twilio.messages.list({ from: addressee });
    //
    //       let conversation = [...sentMessages, ...receivedMessages].map((msg) => parseMessage(msg));
    //       conversation = conversation.sort((a, b) => b.date.getTime() - a.date.getTime());
    //       ws.send({ type: 'fetch-conversation', addressee, conversation });
    //       break;
    //     }
    //
    //     case 'send-message': {
    //       const { error, isReply, addressee, body } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       if (addressee === identity.phone) return ws.send({ error: 'You cannot send a message to yourself' });
    //       if (body.length > 160) return ws.send({ error: 'Message is too long (<160 characters)' });
    //
    //       const params = { body, messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE, from: identity.phone, to: addressee };
    //
    //       try {
    //         const { sid } = await twilio.messages.create(params);
    //
    //         await new Promise((resolve) => setTimeout(resolve, 500));
    //         const messageSent = parseMessage(await twilio.messages(sid).fetch());
    //
    //         ws.send({ type: 'send-message', addressee, messageSent, isReply });
    //         break;
    //       } catch (error) {
    //         ws.send({ error: error instanceof Error ? error.message : error });
    //         break;
    //       }
    //     }
    //
    //     case 'delete-message': {
    //       const { error, addressee } = await checkAPI(message);
    //       if (error) return ws.send({ error });
    //
    //       const receivedMessages = await twilio.messages.list({ to: addressee });
    //       const sentMessages = await twilio.messages.list({ from: addressee });
    //
    //       for (const message of [...receivedMessages, ...sentMessages]) {
    //         await twilio.messages(message.sid).remove();
    //       }
    //
    //       ws.send({ type: 'delete-message', addressee });
    //       break;
    //     }
    //
    //     default:
    //       ws.send({ error: 'Invalid action. Please read the documentation carefully' });
    //       break;
    //   }
    // },
  });
