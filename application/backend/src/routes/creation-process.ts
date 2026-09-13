import {provisionIdentity} from '@core/identity-service';
import type {CreationProcess, QueryIdentity, QueryUser, CreationConnection} from '@type';
import middlewareBase from '@middlewares/middleware-base';
import {ETHNICITIES, LOCATIONS} from '@core/constants';
import {generateProfile} from '@utils/prompts';
import {checkIdentity} from '@utils/checks';
import {sql, twilio} from '@core/services';
import {allFakers} from '@faker-js/faker';
import {Elysia, t} from 'elysia';
import {error} from '@utils/utils';
import {SOCKET_AUTH_INTERVAL} from '@core/constants';

export default new Elysia({websocket: {idleTimeout: 300}})
  .use(middlewareBase)
  .derive(() => ({creation: {jobID: '', busy: false} as CreationConnection}))
  .post('/creation-process', async ({set, user, jwt, body}) => {
    if (!user) return error(set, 401, 'You are not logged in');
    const id = (body as {id?: unknown})?.id;
    if (typeof id !== 'string' || !/^[a-f0-9]{12}$/.test(id)) return error(set, 400, 'Invalid identity');

    const account = (await sql`SELECT id FROM users WHERE email = ${user.email}`) as QueryUser[];
    const identity = (await sql`SELECT * FROM identities WHERE id = ${id} AND owner = ${account[0].id}`) as QueryIdentity[];
    if (!identity.length) return error(set, 404, 'Identity not found');
    if (identity[0].status !== 'inactive') return error(set, 409, 'Identity is already provisioned');

    const jobs = await sql`INSERT INTO creation_jobs (identity_id) VALUES (${id}) RETURNING id`;
    const cookie = await jwt.sign({
      purpose: 'creation',
      job: jobs[0].id,
      identity: id,
      email: user.email,
      session: user.id,
      exp: Math.floor(Date.now() / 1000) + 300,
    });

    return {cookie};
  })
  .ws('/ws-creation-process', {
    query: t.Object({id: t.String({pattern: '^[a-f0-9]{12}$'})}),
    async open(ws) {
      ws.data.creation.ready = (async () => {
        const user = ws.data.user;
        const grant = await ws.data.jwt.verify(ws.data.cookie['creation-process']?.value as string);
        if (
          !user ||
          !grant ||
          grant.purpose !== 'creation' ||
          grant.email !== user.email ||
          grant.session !== user.id ||
          grant.identity !== ws.data.query.id ||
          typeof grant.job !== 'string'
        ) {
          return ws.close(1008, 'Creation authorization is invalid or expired');
        }

        const claimed = await sql`UPDATE creation_jobs j SET status = 'editing' FROM identities i, users u
        WHERE j.id = ${grant.job} AND j.identity_id = i.id AND i.owner = u.id AND u.email = ${user.email}
        AND ${user.id} = ANY(u.sessions) AND i.id = ${ws.data.query.id} AND i.status = 'inactive'
        AND j.status = 'authorized' AND j.created_at > NOW() - INTERVAL '5 minutes' RETURNING j.id`;
        if (!claimed.length) return ws.close(1008, 'Creation authorization was already used');

        if (ws.raw.readyState !== 1) return;
        ws.data.creation.jobID = claimed[0].id;
        ws.data.creation.authTimer = setInterval(async () => {
          if (!(await ws.data.authorize())) ws.close(1008, 'Session expired');
        }, SOCKET_AUTH_INTERVAL);
      })();
      await ws.data.creation.ready;
    },

    close(ws) {
      clearInterval(ws.data.creation.authTimer);
    },
    async message(ws, message: CreationProcess | 'ping') {
      await ws.data.creation.ready;
      if (!(await ws.data.authorize()) || !ws.data.creation.jobID) return ws.close(1008, 'Session expired');
      if (message === 'ping') return ws.send('pong');
      if (ws.data.creation.busy) return ws.send({error: 'Wait for the previous step to finish'});
      ws.data.creation.busy = true;

      try {
        const identityID = ws.data.query.id;
        const jobs = await sql`SELECT payload FROM creation_jobs WHERE id = ${ws.data.creation.jobID} AND status = 'editing'`;
        if (!jobs.length) return ws.close(1008, 'Creation is no longer editable');
        const cookieStore = jobs[0].payload as string[];
        const stepOffsets: Record<string, number> = {
          'submit-location/generate-profile': 0,
          'submit-profile/derive-email': 1,
          'submit-email/find-phones': 7,
          'submit-phone': 8,
          'submit-wallet': 9,
        };
        const append = async (...values: string[]) => {
          const offset = stepOffsets[message.kind];
          if (offset === undefined || cookieStore.length < offset) throw new Error('Complete the previous steps first');
          cookieStore.splice(offset, cookieStore.length - offset, ...values);
          await sql`UPDATE creation_jobs SET payload = ${sql.json(cookieStore)} WHERE id = ${ws.data.creation.jobID}`;
        };

        switch (message.kind) {
          case 'init/fetch-locations': {
            ws.send({locations: LOCATIONS});
            break;
          }

          case 'submit-location/generate-profile': {
            if (message.location) {
              const {location, error} = await checkIdentity('location', message);
              if (error) return ws.send({error});

              await append(location!);
            }

            const lang = LOCATIONS.find((location) => location.code === (cookieStore[0] || message.location));

            const profile = message.regenerate === undefined ? {} : await checkIdentity('profile', message.regenerate);
            if (profile.error) return ws.send({error: profile.error});

            let {name, age, ethnicity, bio, sex} = profile;

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

            await append(picture!, name!, bio!, String(age), sex!, ethnicity!);

            const sanitizedEmail = name!.trim().toLowerCase();
            const emailUsername = sanitizedEmail.replace(/[^\p{L}\p{N}]/gu, '');
            ws.send({email: emailUsername});
            break;
          }

          case 'submit-email/find-phones': {
            const {email, error} = await checkIdentity('email', message);
            if (error) return ws.send({error});

            const sanitizedEmail = email!.trim().toLowerCase();
            await append(sanitizedEmail);

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

            await append(phone!);
            ws.send({_: ''});
            break;
          }

          case 'submit-wallet': {
            const {wallet, error} = await checkIdentity('wallet', message);
            if (error) return ws.send({error});

            const walletEncoded = btoa(JSON.stringify(wallet));
            await append(walletEncoded);
            ws.send({_: ''});
            break;
          }

          case 'provision-identity': {
            const [location, picture, name, bio, age, sex, ethnicity, email, phone, walletEncoded] = cookieStore;
            const wallet = JSON.parse(atob(walletEncoded));

            const params = {location, picture, name, bio, age: Number(age), sex, ethnicity, email, phone, wallet};
            const {error} = await checkIdentity('provision', params);
            if (error) return ws.send({error});

            await provisionIdentity(identityID, ws.data.creation.jobID, params);

            ws.send({done: true});
            break;
          }
        }
      } catch {
        ws.send({error: 'Creation failed. Your progress is saved; retry this step.'});
      } finally {
        ws.data.creation.busy = false;
      }
    },
  });
