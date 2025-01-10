import {createTOTP, getSecret, getAPIKey, createHash, getRecovery} from '../crypto';
import {attempt, verifyEmail} from '../utils';
import {Elysia, error} from 'elysia';
import {jwt} from '@elysiajs/jwt';
import {sql} from '../connection';
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
    const mustLogIn = [...putPaths, ...otherPaths];

    if (mustLogIn.some((p) => relativePath === p) && !user) {
      return error(401, 'You are not logged in');
    }
  })
  .get('/', async ({user}) => {
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    const {email, recovery, totp, api_access, api_key} = result[0];

    return {email, recovery: recovery || [], key: api_key, API: api_access, OTP: totp && true};
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
  .post('/email', async ({user, jwt, body}) => {
    const {err, email, access} = check(body, ['email', 'access']);
    if (err) return error(400, err);

    //@ts-expect-error JWT only accept objects
    const accessToken = await jwt.sign(email + process.env.JWT_SECRET);
    if (access !== accessToken.split('.')[2]) return error(400, 'Invalid access token. Please Try again');

    await attempt(sql`UPDATE users SET email = ${email} WHERE email = ${user!.email}`);

    const cookievalue = await jwt.sign({email, id: user!.id});
    return {cookie: cookievalue};
  })
  .put('/email', async ({body, jwt}) => {
    const {err, email} = check(body, ['email']);
    if (err) return error(400, err);

    const result = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (result.length) return error(400, 'Email address is already registered on our systems');

    //@ts-expect-error JWT only accept objects
    const accessToken = await jwt.sign(email + process.env.JWT_SECRET);
    const response = await verifyEmail(email, accessToken.split('.')[2]);
    if (response.err) return error(500, 'Failed to send verification email. Try later');

    return {email};
  })
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
