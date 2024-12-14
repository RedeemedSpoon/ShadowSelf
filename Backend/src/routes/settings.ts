import {createTOTP, getSecret, getAPIKey, hashPWD, getRecovery} from '../crypto';
import {QueryResult, User} from '../types';
import {Elysia, error} from 'elysia';
import {jwt} from '@elysiajs/jwt';
import {sql} from '../connection';
import {attempt} from '../utils';
import {check} from '../checks';

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
    const mustLog = ['/', '/toggleAPI', '/revoke', '/otp', '/recovery', '/api-key', '/username', '/password', '/billing', '/full'];

    if (mustLog.some((p) => relativePath === p) && !user) {
      return error(401, 'You are not logged in');
    }
  })
  .get('/', async ({user}) => {
    const result = (await attempt(sql`SELECT * FROM users WHERE username = ${user!.username}`)) as QueryResult[];
    const {recovery, totp, api_access, api_key} = result[0];

    return {recovery: recovery || [], key: api_key, API: api_access, OTP: totp && true};
  })
  .get('/otp', async ({user}) => {
    const secret = getSecret();
    const totp = createTOTP(secret, user!.username);
    const uri = totp.toString();
    return {uri, secret};
  })
  .get('/recovery', async ({user}) => {
    const otp = (await attempt(sql`SELECT totp FROM users WHERE username = ${user!.username}`)) as QueryResult[];
    if (!otp[0].totp) return error(400, '2FA is disabled. Enable it to proceed');

    const recoveryCodes = getRecovery();
    await attempt(sql`UPDATE users SET recovery = ${recoveryCodes}  WHERE username = ${user!.username}`);
    return {recovery: recoveryCodes};
  })
  .get('/toggleAPI', async ({user}) => {
    const access = (await attempt(sql`SELECT api_access FROM users WHERE username = ${user!.username}`)) as QueryResult[];
    const toggle = !access[0].api_access;

    await attempt(sql`UPDATE users SET api_access = ${toggle} WHERE username = ${user!.username}`);
    return {API: toggle};
  })
  .get('/api-key', async ({user}) => {
    const access = (await attempt(sql`SELECT api_access FROM users WHERE username = ${user!.username}`)) as QueryResult[];
    if (!access[0].api_access) return error(400, 'API access is disabled. Enable it to proceed');

    const key = getAPIKey();
    await attempt(sql`UPDATE users SET api_key = ${key} WHERE username = ${user!.username}`);
    return {key};
  })
  .get('/revoke', async ({user}) => {
    await attempt(sql`UPDATE users SET revoke_session = ARRAY[]::varchar(8)[] WHERE username = ${user!.username}`);
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
    await attempt(sql`UPDATE users SET totp = ${secret}, recovery = ${recoveryCodes} WHERE username = ${user!.username}`);
    return {recovery: recoveryCodes};
  })
  .put('/username', async ({jwt, user, body}) => {
    const {err, username} = check(body, ['username']);
    if (err) return error(400, err);

    if (user!.username !== username) {
      const isTaken = (await attempt(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
      if (isTaken.length) return error(409, 'This username is already taken');
    }

    await attempt(sql`UPDATE users SET username = ${username} WHERE username = ${user!.username}`);

    const cookieValue = await jwt.sign({password: user!.password, username, id: user!.id});
    return {cookie: cookieValue};
  })
  .put('/password', async ({jwt, user, body}) => {
    const {err, password} = check(body, ['password']);
    if (err) return error(400, err);

    const hashedPassword = await hashPWD(password);
    await attempt(sql`UPDATE users SET password = ${hashedPassword} WHERE username = ${user!.username}`);

    const cookieValue = await jwt.sign({password, username: user!.username, id: user!.id});
    return {cookie: cookieValue};
  })
  .delete('/otp', async ({user}) => {
    await attempt(sql`UPDATE users SET recovery = ARRAY[]::varchar(9)[], totp = NULL WHERE username = ${user!.username}`);
  })
  .delete('/full', async ({user}) => await attempt(sql`DELETE FROM users WHERE username = ${user!.username}`));
