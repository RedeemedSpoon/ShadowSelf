import type {User, CreationProcess, QueryIdentity, QueryUser} from '@type';
import {createCreationProcessToken, consumeCreationProcessToken, generateProxyPassword} from '@utils/cryptography';
import middlewareBase from '@middlewares/middleware-base';
import {ETHNICITIES, LOCATIONS} from '@core/constants';
import {generateProfile} from '@utils/prompts';
import {checkIdentity} from '@utils/checks';
import {sql, twilio} from '@core/services';
import {origin, twilioConfig} from '@core/config';
import {error, proxyRequest} from '@utils/utils';
import {allFakers} from '@faker-js/faker';
import {Elysia, t} from 'elysia';
import {$} from 'bun';

const CREATION_PROCESS_COOKIE = 'creation-process';
const CREATION_PROCESS_AUTH_ERROR = 'You do not have permission to perform this action';

export default new Elysia({websocket: {idleTimeout: 300}})
  .use(middlewareBase)
  .post('/creation-process', async ({headers, jwt, body, set}) => {
    const sessionToken = getBearerToken(headers['authorization']);
    if (!sessionToken) return error(set, 401, CREATION_PROCESS_AUTH_ERROR);

    const user = (await jwt.verify(sessionToken)) as User;
    if (!user) return error(set, 401, CREATION_PROCESS_AUTH_ERROR);

    const {id} = body as {id: string};
    const account = (await sql`SELECT id FROM users WHERE email = ${user.email}`) as QueryUser[];
    if (!account.length) return error(set, 401, CREATION_PROCESS_AUTH_ERROR);

    const identity = (await sql`SELECT owner, status FROM identities WHERE id = ${id}`) as QueryIdentity[];

    if (!identity.length) return error(set, 404, 'Identity not found');
    if (identity[0].owner !== account[0].id) return error(set, 401, CREATION_PROCESS_AUTH_ERROR);
    if (identity[0].status !== 'inactive') return error(set, 400, 'Identity is not ready for creation');

    const cookie = createCreationProcessToken({identityID: id, sessionToken, userID: account[0].id});
    return {cookie};
  })
  .ws('/ws-creation-process', {
    query: t.Object({id: t.String()}),
    async open(ws) {
      const issue = await authorizeCreationProcessSocket(ws);
      if (issue) return ws.close(1014, getCreationProcessAuthMessage(issue));
    },

    async message(ws, message: CreationProcess | 'ping') {
      if (message === 'ping') return ws.send('pong');

      const auth = (ws.data as any).creationProcessAuth as {cookie: any; identityID: string} | undefined;
      if (!auth) return ws.close(1014, CREATION_PROCESS_AUTH_ERROR);

      const {cookie, identityID} = auth;
      const [, ...cookieStore] = parseCreationProcessCookie(cookie.value);

      switch (message.kind) {
        case 'init/fetch-locations': {
          ws.send({locations: LOCATIONS});
          break;
        }

        case 'submit-location/generate-profile': {
          if (message.location) {
            const {location, error} = await checkIdentity('location', message);
            if (error) return ws.send({error});

            cookie.set({value: cookie.value + `&&${location}`});
          }

          const lang = LOCATIONS.find((location) => location.code === (cookieStore[0] || message.location));

          const checkedIdentity = (await checkIdentity('identity', message.regenerate)) || {};
          const {error} = checkedIdentity;
          let {name, age, ethnicity, bio, sex} = checkedIdentity;
          if (error) return ws.send({error});

          if (!message.regenerate) {
            const faker = allFakers[lang?.localization as keyof typeof allFakers];

            if (message.repeat) {
              if (message.repeat.name) {
                name = faker.person.fullName({sex: message.repeat.sex});
                ws.send({repeat: {name}});
              }
              if (message.repeat.bio) {
                bio = faker.person.bio();
                ws.send({repeat: {bio}});
              }
              break;
            }

            sex = Math.random() > 0.5 ? 'male' : 'female';
            name = faker.person.fullName({sex: sex as 'male' | 'female'});
            bio = faker.person.bio();

            ethnicity = ETHNICITIES[Math.floor(Math.random() * ETHNICITIES.length)];
            age = Math.floor(Math.random() * 42) + 18;
          }

          const picture = await generateProfile(lang!, age!, sex!, ethnicity!, bio!);
          const identity = {picture, name, bio, sex, age, ethnicity};

          ws.send({identity});
          break;
        }

        case 'submit-profile/derive-email': {
          const {picture, name, bio, sex, age, ethnicity, error} = await checkIdentity('identity', message.identity);
          if (error) return ws.send({error});

          const cookieString = `&&${picture}&&${name}&&${bio}&&${age}&&${sex}&&${ethnicity}`;
          cookie.set({value: cookie.value + cookieString});

          const sanitizedEmail = name!.trim().toLowerCase();
          const emailUsername = sanitizedEmail.replace(/[^\p{L}\p{N}]/gu, '');
          ws.send({email: emailUsername});
          break;
        }

        case 'submit-email/find-phones': {
          const {email, error} = await checkIdentity('email', message);
          if (error) return ws.send({error});

          const sanitizedEmail = email!.trim().toLowerCase();
          cookie.set({value: cookie.value + `&&${sanitizedEmail}`});

          const location = cookieStore[0];
          const phoneType = location === 'GB' ? 'mobile' : 'local';

          const result = await twilio.availablePhoneNumbers(location)[phoneType as 'local'].list({
            limit: 20,
            smsEnabled: true,
          });

          const phone = result.map((phone) => phone.phoneNumber);
          ws.send({phone});
          break;
        }

        case 'submit-phone': {
          const {phone, error} = await checkIdentity('phone', message);
          if (error) return ws.send({error});

          cookie.set({value: cookie.value + `&&${phone}`});
          ws.send({_: ''});
          break;
        }

        case 'submit-wallet': {
          const {wallet, error} = await checkIdentity('wallet', message);
          if (error) return ws.send({error});

          const walletEncoded = btoa(JSON.stringify(wallet));
          cookie.set({value: cookie.value + `&&${walletEncoded}`});
          ws.send({_: ''});
          break;
        }

        case 'provision-identity': {
          const [location, picture, name, bio, age, sex, ethnicity, email, phone, walletEncoded] = cookieStore;
          const wallet = JSON.parse(atob(walletEncoded));

          const params = {location, picture, name, bio, age: Number(age), sex, ethnicity, email, phone, wallet};
          const {error} = await checkIdentity('provision', params);
          if (error) return ws.send({error});

          const loc = LOCATIONS.find((loc) => loc.code === location);
          const fullLocation = `${loc!.code}, ${loc!.city}, ${loc!.country}`;
          const proxyServer = loc!.ip;

          const proxyPassword = generateProxyPassword();
          await proxyRequest(loc!.code.toLowerCase(), 'POST', {username: identityID, password: proxyPassword});

          const emailUsername = email!.split('@')[0];
          const emailPassword = (await $`openssl rand -base64 24`.quiet()).stdout.toString('utf-8').trim();

          const walletKeys = JSON.stringify(wallet.keys);
          const daysSinceEpoch = Math.floor(Date.now() / 1000 / 86400);
          const passwordHash = (await $`openssl passwd -6 "${emailPassword}"`.text()).trim();

          const idsRaw =
            await $`U=$(awk -F: '($3>=1000){print $3}' /etc/passwd|sort -n|tail -1|awk '{print $1+1}'); G=$(getent group mail|cut -d: -f3); echo $U:$G`.text();
          const [uid, gid] = idsRaw.trim().split(':');

          await $`
            echo "${emailUsername}:x:${uid}:${gid}::/home/${emailUsername}:/bin/sh" >> /etc/passwd
            echo "${emailUsername}:${passwordHash}:${daysSinceEpoch}:0:99999:7:::" >> /etc/shadow      
            sed -i "/^mail:/ s/$/,${emailUsername}/" /etc/group

            mkdir -p /home/${emailUsername} && cp -r /etc/skel/. /home/${emailUsername}
            chown -R ${uid}:${gid} /home/${emailUsername}
          `
            .nothrow()
            .quiet();

          const result = await twilio.incomingPhoneNumbers.create({
            emergencyStatus: 'Inactive',
            smsUrl: `${origin}/webhook-twilio`,
            phoneNumber: phone,
          });

          const messagingService = twilio.messaging.v1.services(twilioConfig.messagingService!);
          await messagingService.phoneNumbers.create({phoneNumberSid: result.sid});

          await sql`UPDATE identities SET location = ${fullLocation}, proxy_server = ${proxyServer} WHERE id = ${identityID}`;
          await sql`UPDATE identities SET proxy_password = ${proxyPassword} WHERE id = ${identityID}`;

          await sql`UPDATE identities SET picture = ${picture}, name = ${name}, bio = ${bio} WHERE id = ${identityID}`;
          await sql`UPDATE identities SET age = ${age}, sex = ${sex}, ethnicity = ${ethnicity} WHERE id = ${identityID}`;

          await sql`UPDATE identities SET email = ${email}, email_password = ${emailPassword} WHERE id = ${identityID}`;
          await sql`UPDATE identities SET phone = ${phone}, twilio_phone_sid = ${result.sid} WHERE id = ${identityID}`;

          await sql`UPDATE identities SET wallet_blob = ${wallet.blob}, wallet_keys = ${walletKeys} WHERE id = ${identityID}`;
          await sql`UPDATE identities SET status = 'active' WHERE id = ${identityID}`;

          cookie.remove();
          ws.send({done: true});
          break;
        }
      }
    },
  });

function getBearerToken(auth: string | undefined) {
  return auth && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;
}

async function authorizeCreationProcessSocket(ws: any) {
  const cookie = ws.data.cookie[CREATION_PROCESS_COOKIE];
  const sessionCookie = ws.data.cookie.token;
  const [token] = parseCreationProcessCookie(cookie?.value);

  if (!token || !sessionCookie?.value) return 'missing';

  const user = (await ws.data.jwt.verify(sessionCookie.value)) as User;
  if (!user) return 'mismatch';

  const account = (await sql`SELECT id FROM users WHERE email = ${user.email}`) as QueryUser[];
  if (!account.length) return 'mismatch';

  const identityID = ws.data.query.id;
  const issue = consumeCreationProcessToken(token, {identityID, sessionToken: sessionCookie.value, userID: account[0].id});
  if (issue) return issue;

  const identity =
    (await sql`SELECT id FROM identities WHERE id = ${identityID} AND owner = ${account[0].id} AND status = 'inactive'`) as QueryIdentity[];
  if (!identity.length) return 'mismatch';

  ws.data.creationProcessAuth = {cookie, identityID};
}

function parseCreationProcessCookie(value: string | undefined) {
  return (value || '').split('&&');
}

function getCreationProcessAuthMessage(issue: string) {
  if (issue === 'expired') return 'Creation session expired. Reload to continue';
  return CREATION_PROCESS_AUTH_ERROR;
}
