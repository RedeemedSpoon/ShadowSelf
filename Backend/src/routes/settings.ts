import {createTOTP, getSecret, getAPIKey, createHash, getRecovery} from '../crypto';
import {Elysia, error} from 'elysia';
import {jwt} from '@elysiajs/jwt';
import {sql} from '../connection';
import {attempt} from '../utils';
import {check} from '../checks';
import {User} from '../types';

export default new Elysia({prefix: '/settings'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  })
  .onBeforeHandle(({user, path}) => {
    const relativePath = path.slice(9);
    const putPaths = ['/email', '/username', '/password', '/billing'];
    const otherPaths = ['/', '/revoke', '/otp', '/recovery', '/api-access', '/api-key', '/full'];

    if ((putPaths.some((p) => relativePath === p) || otherPaths.some((p) => relativePath === p)) && !user) {
      return error(401, 'You are not logged in');
    }
  })
  .get('/', async ({user}) => {
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    const {recovery, totp, api_access, api_key} = result[0];

    return {recovery: recovery || [], key: api_key, API: api_access, OTP: totp && true};
  })
  .get('/otp', async ({user}) => {
    const result = await attempt(sql`SELECT username FROM users WHERE email = ${user!.email}`);
    const username = result[0].username;

    const secret = getSecret();
    const totp = createTOTP(secret, username);
    const uri = totp.toString();

    return {uri, secret};
  })
  .get('/recovery', async ({user}) => {
    const otp = await attempt(sql`SELECT totp FROM users WHERE email = ${user!.email}`);
    if (!otp[0].totp) return error(400, '2FA is disabled. Enable it to proceed');

    const recoveryCodes = getRecovery();
    await attempt(sql`UPDATE users SET recovery = ${recoveryCodes} WHERE email = ${user!.email}`);

    return {recovery: recoveryCodes};
  })
  .get('/api-access', async ({user}) => {
    const access = await attempt(sql`SELECT api_access FROM users WHERE email = ${user!.email}`);
    const toggle = !access[0].api_access;

    await attempt(sql`UPDATE users SET api_access = ${toggle} WHERE email = ${user!.email}`);
    return {API: toggle};
  })
  .get('/api-key', async ({user}) => {
    const access = await attempt(sql`SELECT api_access FROM users WHERE email = ${user!.email}`);
    if (!access[0].api_access) return error(400, 'API access is disabled. Enable it to proceed');

    const key = getAPIKey();
    await attempt(sql`UPDATE users SET api_key = ${key} WHERE email = ${user!.email}`);
    return {key};
  })
  .get('/revoke', async ({user}) => {
    await attempt(sql`UPDATE users SET revoke_session = ARRAY[]::varchar(8)[] WHERE email = ${user!.email}`);
  })
  .post('/otp-check', async ({body}) => {
    const {err, secret, token} = check(body, ['token', 'secret']);
    if (err) return error(400, err);

    const totp = createTOTP(secret, 'temporarily');
    const isValid = totp.generate() === token;

    if (!isValid) return error(400, 'Incorrect validation token. Please try again');
  })
  .post('/otp', async ({body, user}) => {
    const {err, secret} = check(body, ['secret']);
    if (err) return error(400, err);

    const recoveryCodes = getRecovery();
    await attempt(sql`UPDATE users SET totp = ${secret}, recovery = ${recoveryCodes} WHERE email = ${user!.email}`);
    return {recovery: recoveryCodes};
  })
  .post('/email', async ({user, body}) => {})
  .put('/email', async ({user, body}) => {})
  .put('/username', async ({user, body}) => {
    const {err, username} = check(body, ['username']);
    if (err) return error(400, err);

    await attempt(sql`UPDATE users SET username = ${username} WHERE email = ${user!.email}`);
  })
  .put('/password', async ({user, body}) => {
    const {err, password} = check(body, ['password']);
    if (err) return error(400, err);

    const hashedPassword = await createHash(password);
    await attempt(sql`UPDATE users SET password = ${hashedPassword} WHERE email = ${user!.email}`);
  })
  .delete('/otp', async ({user}) => {
    await attempt(sql`UPDATE users SET recovery = ARRAY[]::varchar(9)[], totp = NULL WHERE email = ${user!.email}`);
  })
  .delete('/full', async ({user}) => await attempt(sql`DELETE FROM users WHERE email = ${user!.email}`));
