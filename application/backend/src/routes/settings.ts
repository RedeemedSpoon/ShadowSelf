import {createTOTP, getSecret, getAPIKey, createHash, getRecovery} from '@utils/crypto';
import {sendOfficialEmail} from '@utils/email-smtp';
import {attempt, error, request} from '@utils/utils';
import {sql} from '@utils/connection';
import middleware from '@middleware';
import {check} from '@utils/checks';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/settings'})
  .use(middleware)
  .onBeforeHandle(({set, user, path}) => {
    const relativePath = path.slice(9);
    const paths = ['', '/revoke', '/otp', '/recovery', '/payment', '/api-access', '/api-key', '/full'];
    const mustLogIn = [...paths, '/email', '/username', '/password'];

    if (mustLogIn.some((p) => relativePath === p || relativePath === p + '/') && !user) {
      return error(set, 401, 'You are not logged in');
    }
  })
  .get('/', async ({user}) => {
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    const {email, recovery, totp, api_access, api_key} = result[0];

    const res = await request('/billing/portal', 'POST', {email});
    const sessionUrl = res?.sessionUrl || '';

    return {sessionUrl, email, recovery: recovery || [], key: api_key, API: api_access, OTP: totp && true};
  })
  .get('/otp', async ({user}) => {
    const result = await attempt(sql`SELECT username FROM users WHERE email = ${user!.email}`);
    const username = result[0].username;

    const secret = getSecret();
    const totp = createTOTP(secret, username);
    const uri = totp.toString();

    return {uri, secret};
  })
  .get('/recovery', async ({set, user}) => {
    const otp = await attempt(sql`SELECT totp FROM users WHERE email = ${user!.email}`);
    if (!otp[0].totp) return error(set, 400, '2FA is disabled. Enable it to proceed');

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
  .get('/api-key', async ({set, user}) => {
    const access = await attempt(sql`SELECT api_access FROM users WHERE email = ${user!.email}`);
    if (!access[0].api_access) return error(set, 400, 'API access is disabled. Enable it to proceed');

    const key = getAPIKey();
    await attempt(sql`UPDATE users SET api_key = ${key} WHERE email = ${user!.email}`);
    return {key};
  })
  .get('/revoke', async ({user}) => {
    await attempt(sql`UPDATE users SET revoke_session = ARRAY[]::varchar(8)[] WHERE email = ${user!.email}`);
  })
  .post('/otp-check', async ({set, body}) => {
    const {err, secret, token} = check(body, ['token', 'secret']);
    if (err) return error(set, 400, err);

    const totp = createTOTP(secret, 'temporarily');
    const isValid = totp.generate() === token;

    if (!isValid) return error(set, 400, 'Incorrect validation token. Please try again');
  })
  .post('/otp', async ({set, body, user}) => {
    const {err, secret} = check(body, ['secret']);
    if (err) return error(set, 400, err);

    const recoveryCodes = getRecovery();
    await attempt(sql`UPDATE users SET totp = ${secret}, recovery = ${recoveryCodes} WHERE email = ${user!.email}`);

    return {recovery: recoveryCodes};
  })
  .post('/payment', async ({set, body, user}) => {
    const {err, payment} = check(body, ['payment']);
    if (err) return error(set, 400, err);

    const email = user!.email;
    await request('/billing/customer', 'PUT', {email, payment});
    const res = await request('/billing/portal', 'POST', {email});

    return {sessionUrl: res.sessionUrl || ''};
  })
  .post('/email', async ({set, user, jwt, body}) => {
    const {err, email, access} = check(body, ['email', 'access']);
    if (err) return error(set, 400, err);

    //@ts-expect-error JWT only accept objects
    const accessToken = await jwt.sign(email + process.env.SECRET_SAUCE);
    if (access !== accessToken.split('.')[2]) return error(set, 400, 'Invalid access token. Please Try again');

    await request('/billing/customer', 'PATCH', {oldEmail: user!.email, email});
    await attempt(sql`UPDATE users SET email = ${email} WHERE email = ${user!.email}`);

    const cookievalue = await jwt.sign({email, id: user!.id});
    return {cookie: cookievalue};
  })
  .put('/email', async ({set, body, jwt}) => {
    const {err, email} = check(body, ['email']);
    if (err) return error(set, 400, err);

    const result = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (result.length) return error(set, 400, 'Email address is already registered on our systems');

    //@ts-expect-error JWT only accept objects
    const accessToken = await jwt.sign(email + process.env.SECRET_SAUCE);
    const response = await sendOfficialEmail(email, accessToken.split('.')[2], 'change');
    if (response.err) return error(set, 500, 'Failed to send verification email. Try later');

    return {email};
  })
  .put('/username', async ({set, user, body}) => {
    const {err, username} = check(body, ['username']);
    if (err) return error(set, 400, err);

    await attempt(sql`UPDATE users SET username = ${username} WHERE email = ${user!.email}`);
  })
  .put('/password', async ({set, user, body}) => {
    const {err, password} = check(body, ['password']);
    if (err) return error(set, 400, err);

    const hashedPassword = await createHash(password);
    await attempt(sql`UPDATE users SET password = ${hashedPassword} WHERE email = ${user!.email}`);
  })
  .delete('/otp', async ({user}) => {
    await attempt(sql`UPDATE users SET totp = NULL WHERE email = ${user!.email}`);
    await attempt(sql`UPDATE users SET recovery = ARRAY[]::varchar(9)[] WHERE email = ${user!.email}`);
  })
  .delete('/full', async ({user}) => {
    const account = await attempt(sql`SELECT id FROM users WHERE email = ${user!.email}`);
    const allPuchases = await attempt(sql`SELECT * FROM identities WHERE owner = ${account?.[0].id}`);

    for (const purchase of allPuchases) {
      await request('/billing/cancel', 'DELETE', {id: purchase.id});
    }

    await request('/billing/customer', 'DELETE', {email: user!.email});
    await attempt(sql`DELETE FROM users WHERE email = ${user!.email}`);
  });
