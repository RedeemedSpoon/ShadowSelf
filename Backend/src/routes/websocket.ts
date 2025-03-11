import {fetchMoreEmails, listenForEmail, fetchReply, deleteEmail} from '../email-imap';
import {User, WebsocketRequest, Location} from '../types';
import {sendIdentityEmail} from '../email-smtp';
import {generateProfile} from '../prompts';
import {attempt, request} from '../utils';
import {allFakers} from '@faker-js/faker';
import {checkAPI} from '../checks';
import {jwt} from '@elysiajs/jwt';
import {sql} from '../connection';
import {Elysia} from 'elysia';

export default new Elysia().use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string})).ws('/ws/api/:id', {
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

    // @ts-expect-error Websocket type
    listenForEmail(ws, identity.email, identity.email_password);
  },
  async message(ws, message: WebsocketRequest | 'ping') {
    if (message === 'ping') return ws.send('pong');

    const params = ws.data.params.id;
    const identity = (await attempt(sql`SELECT * FROM identities WHERE id = ${params}`))[0];

    switch (message.type) {
      case 'regenerate-picture': {
        const mes = {sex: identity.sex, age: identity.age, ethnicity: identity.ethnicity, bio: identity.bio, ...message};
        const {error, sex, age, ethnicity, bio} = await checkAPI(mes);
        if (error) return ws.send({error});

        const locations = (await request('/extension-api', 'GET')) as Location[];
        const lang = locations.find((location) => location.code === identity.location.split(',')[0]);

        const picture = await generateProfile(lang!, age!, sex!, ethnicity!, bio!);
        ws.send({type: 'regenerate-picture', picture});
        break;
      }

      case 'regenerate-name': {
        const mes = {sex: identity.sex, ...message};
        const {error, sex} = await checkAPI(mes);
        if (error) return ws.send({error});

        const locations = (await request('/extension-api', 'GET')) as Location[];
        const lang = locations.find((location) => location.code === identity.location.split(',')[0]);

        const faker = allFakers[lang?.localization as keyof typeof allFakers];
        const name = faker.person.fullName({sex: sex as 'male' | 'female'});

        ws.send({type: 'regenerate-name', name});
        break;
      }

      case 'regenerate-bio': {
        const locations = (await request('/extension-api', 'GET')) as Location[];
        const lang = locations.find((location) => location.code === identity.location.split(',')[0]);

        const faker = allFakers[lang?.localization as keyof typeof allFakers];
        const bio = faker.person.bio();

        ws.send({type: 'regenerate-bio', bio});
        break;
      }

      case 'update-information': {
        const mes1 = {sex: identity.sex, ethnicity: identity.ethnicity, age: identity.age};
        const mes2 = {name: identity.name, bio: identity.bio, ...message, picture: identity.picture};
        const {error, sex, ethnicity, age, name, bio, picture} = await checkAPI({...mes1, ...mes2, ...message});
        if (error) return ws.send({error});

        await attempt(sql`UPDATE identities SET sex = ${sex!}, ethnicity = ${ethnicity!}, age = ${age!} WHERE id = ${identity.id}`);
        await attempt(sql`UPDATE identities SET name = ${name!}, bio = ${bio!}, picture = ${picture!} WHERE id = ${identity.id}`);

        ws.send({type: 'update-information', sex, ethnicity, age, name, bio, picture});
        break;
      }

      case 'add-account': {
        const {error, username, password, website, totp, algorithm} = await checkAPI(message);
        if (error) return ws.send({error});

        const res = await attempt(
          sql`INSERT INTO accounts (owner, username, password) VALUES (${identity.id}, ${username!}, ${password!}) RETURNING id`,
        );

        if (website) await attempt(sql`UPDATE accounts SET website = ${website!} WHERE id = ${res[0].id}`);
        if (totp) await attempt(sql`UPDATE accounts SET totp = ${totp!}, algorithm = ${algorithm!} WHERE id = ${res[0].id!}`);

        ws.send({type: 'add-account', username, password, website, totp, algorithm, id: res[0].id});
        break;
      }

      case 'edit-account': {
        const {error, username, password, website, totp, algorithm, id} = await checkAPI(message);
        if (error) return ws.send({error});

        await attempt(sql`UPDATE accounts SET username = ${username!}, password = ${password!} WHERE id= ${id!}`);
        if (website) await attempt(sql`UPDATE accounts SET website = ${website!} WHERE id = ${id!}`);
        if (totp) await attempt(sql`UPDATE accounts SET totp = ${totp!}, algorithm = ${algorithm!} WHERE id = ${id!}`);

        ws.send({type: 'edit-account', username, password, website, totp, algorithm, id});
        break;
      }

      case 'remove-account': {
        const {error, id} = await checkAPI(message);
        if (error) return ws.send({error});

        await attempt(sql`DELETE FROM accounts WHERE id = ${id!}`);
        ws.send({type: 'remove-account', id});
        break;
      }

      case 'update-encryption': {
        if (!message.accounts || typeof message.accounts !== 'object') return ws.send({error: 'Accounts Array are required'});

        for (const account of message.accounts) {
          const {error, id, password, totp} = await checkAPI(account);
          if (error) return ws.send({error});

          await attempt(sql`UPDATE accounts SET password = ${password!} WHERE id = ${id!}`);
          if (totp) await attempt(sql`UPDATE accounts SET totp = ${totp!} WHERE id = ${id!}`);
        }

        ws.send({type: 'update-encryption', accounts: message.accounts});
        break;
      }

      case 'fetch-reply': {
        const {error, uuid} = await checkAPI(message);
        if (error) return ws.send({error});

        const email = await fetchReply(identity.email, identity.email_password, uuid!);
        ws.send({type: 'fetch-reply', uuid, fetchEmail: email});
        break;
      }

      case 'send-email': {
        const {error, to, inReplyTo, attachments, subject, body} = await checkAPI(message);
        if (error) return ws.send({error});

        if (inReplyTo) await sendIdentityEmail(identity.email, identity.email_password, inReplyTo, subject!, body!, attachments!);
        else await sendIdentityEmail(identity.email, identity.email_password, to!, subject!, body!, attachments!);
        break;
      }

      case 'send-draft': {
        break;
      }

      case 'load-more': {
        const {error, mailbox, from} = await checkAPI(message);
        if (error) return ws.send({error});

        const emails = await fetchMoreEmails(identity.email, identity.email_password, mailbox!, from!);
        ws.send({type: 'load-more', mailbox, from, emails});
        break;
      }

      case 'delete-email': {
        const {error, mailbox, uid} = await checkAPI(message);
        if (error) return ws.send({error});

        await deleteEmail(identity.email, identity.email_password, mailbox!, message.uid!);
        ws.send({type: 'delete-email', mailbox, uid});
        break;
      }

      default:
        ws.send({error: 'Invalid action. Please read the documentation carefully'});
        break;
    }
  },
});
