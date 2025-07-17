import {sql, twilio, origin} from '@utils/connection';
import {generateProxyPassword} from '@utils/crypto';
import {attempt, proxyRequest} from '@utils/utils';
import {generateProfile} from '@utils/prompts';
import {User, CreationProcess} from '@types';
import {checkIdentity} from '@utils/checks';
import {allFakers} from '@faker-js/faker';
import locations from '@utils/locations';
import middleware from '@middleware';
import {Elysia, t} from 'elysia';
import {$} from 'bun';

export default new Elysia({websocket: {idleTimeout: 300}})
  .use(middleware)
  .post('/creation-process', async ({headers, jwt, body}) => {
    const auth = headers['authorization'];
    const token = auth && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;

    const user = (await jwt.verify(token)) as User;
    if (!user) return;

    const {id} = body as {id: string};
    const account = await attempt(sql`SELECT * FROM users WHERE email = ${user?.email}`);
    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${id}`);

    if (!identity.length) return;
    if (identity[0].owner !== account[0].id) return;
    if (identity[0].status !== 'inactive') return;

    //@ts-expect-error JWT only accept objects
    let cookie = await jwt.sign(id + process.env.SECRET_SAUCE);
    cookie = cookie.split('.')[2];
    return {cookie};
  })
  .ws('/ws-creation-process', {
    query: t.Object({id: t.String()}),
    async message(ws, message: CreationProcess | 'ping') {
      if (message === 'ping') return ws.send('pong');

      const cookie = ws.data.cookie['creation-process'];
      if (!cookie) return ws.close(1014, 'You do not have permission to perform this action');

      const [validationCookie, ...cookieStore] = cookie.value?.split('&&') || [];
      const identityID = ws.data.query.id;

      //@ts-expect-error JWT only accept objects
      const validToken = await ws.data.jwt.sign(identityID + process.env.SECRET_SAUCE);
      if (validToken.split('.')[2] !== validationCookie) return ws.close(1014, 'You do not have permission to perform this action');

      switch (message.kind) {
        case 'locations': {
          ws.send({locations});
          break;
        }

        case 'identities': {
          if (message.location) {
            const {location, error} = await checkIdentity('location', message);
            if (error) return ws.send({error});

            cookie.set({value: cookie.value + `&&${location}`});
          }

          const ethnicities = ['caucasian', 'black', 'hispanic', 'slav', 'arab', 'east asian', 'south asian'];
          const lang = locations.find((location) => location.code === (cookieStore[0] || message.location));

          let {name, age, ethnicity, bio, sex, error} = (await checkIdentity('identity', message.regenerate)) || {};
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

            ethnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
            age = Math.floor(Math.random() * 42) + 18;
            error = undefined;
          }

          const picture = await generateProfile(lang!, age!, sex!, ethnicity!, bio!);
          const identity = {picture, name, bio, sex, age, ethnicity};

          ws.send({identity});
          break;
        }

        case 'email': {
          const {picture, name, bio, sex, age, ethnicity, error} = await checkIdentity('identity', message.identity);
          if (error) return ws.send({error});

          const cookieString = `&&${picture}&&${name}&&${bio}&&${age}&&${sex}&&${ethnicity}`;
          cookie.set({value: cookie.value + cookieString});

          const sanitizedEmail = name!.trim().toLowerCase();
          const emailUsername = sanitizedEmail.replace(/[^\p{L}\p{N}]/gu, '');
          ws.send({email: emailUsername});
          break;
        }

        case 'phone': {
          const {email, error} = await checkIdentity('email', message);
          if (error) return ws.send({error});

          const sanitizedEmail = email!.trim().toLowerCase();
          cookie.set({value: cookie.value + `&&${sanitizedEmail}`});

          const location = cookieStore[0];
          const phoneType = location === 'CA' ? 'local' : 'mobile';

          const result = await twilio.availablePhoneNumbers(location)[phoneType as 'local'].list({
            limit: 20,
            smsEnabled: true,
          });

          const phone = result.map((phone) => ({phone: phone.phoneNumber, formatted: phone.friendlyName}));
          ws.send({phone});
          break;
        }

        case 'card': {
          const {phone, error} = await checkIdentity('phone', message);
          if (error) return ws.send({error});

          cookie.set({value: cookie.value + `&&${phone}`});
          ws.send({card: '4242 4242 4242 4242'});
          break;
        }

        case 'extension': {
          const {card, error} = await checkIdentity('card', message);
          if (error) return ws.send({error});

          cookie.set({value: cookie.value + `&&${card}`});
          ws.send({_: null});
          break;
        }

        case 'finish': {
          const [location, picture, name, bio, age, sex, ethnicity, email, phone, card] = cookieStore;
          const params = {location, picture, name, bio, age: Number(age), sex, ethnicity, email, phone, card};
          const {error} = await checkIdentity('finish', params);
          if (error) return ws.send({error});

          const loc = locations.find((loc) => loc.code === location);
          const fullLocation = `${loc!.code}, ${loc!.city}, ${loc!.country}`;
          const proxyServer = loc!.ip;

          const proxyPassword = generateProxyPassword();
          await proxyRequest(loc!.code.toLowerCase(), 'POST', {username: identityID, password: proxyPassword});

          const emailUsername = email!.split('@')[0];
          const emailPassword = (await $`openssl rand -base64 24`.quiet()).stdout.toString('utf-8').trim();

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

          const messagingService = twilio.messaging.v1.services(process.env.TWILIO_MESSAGING_SERVICE!);
          messagingService.phoneNumbers.create({phoneNumberSid: result.sid});

          await attempt(sql`UPDATE identities SET location = ${fullLocation}, proxy_server = ${proxyServer} WHERE id = ${identityID}`);
          await attempt(sql`UPDATE identities SET proxy_password = ${proxyPassword} WHERE id = ${identityID}`);
          await attempt(sql`UPDATE identities SET picture = ${picture}, name = ${name}, bio = ${bio} WHERE id = ${identityID}`);
          await attempt(sql`UPDATE identities SET age = ${age}, sex = ${sex}, ethnicity = ${ethnicity} WHERE id = ${identityID}`);

          await attempt(sql`UPDATE identities SET email = ${email}, email_password = ${emailPassword} WHERE id = ${identityID}`);
          await attempt(sql`UPDATE identities SET phone = ${phone}  WHERE id = ${identityID}`);
          await attempt(sql`UPDATE identities SET card = ${card} WHERE id = ${identityID}`);
          await attempt(sql`UPDATE identities SET status = 'active' WHERE id = ${identityID}`);

          cookie.remove();
          ws.send({finish: true});
          break;
        }
      }
    },
  });
