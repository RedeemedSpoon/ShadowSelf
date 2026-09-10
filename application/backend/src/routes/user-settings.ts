import {consumeEmailCode} from '@core/states';
import {createTOTP, getSecret, getAPIKey, createHash, getRecovery, hashRecoveryCode, compareHash} from '@utils/cryptography';
import middlewareBase from '@middlewares/middleware-base';
import {sendVerificationCode} from '@utils/email-smtp';
import type {QueryUser, QueryIdentity} from '@type';
import {error, request} from '@utils/utils';
import {check} from '@utils/checks';
import {sql} from '@core/services';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/settings'})
  .use(middlewareBase)
  .onBeforeHandle(({set, user}) => {
    set.headers['cache-control'] = 'no-store';
    if (!user) return error(set, 401, 'You are not logged in');
  })
  .get('/', async ({user}) => {
    const result = (await sql`SELECT * FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const {email, recovery_hashes, totp, api_access, api_key} = result[0];

    const res = await request('/billing/fiat/portal', 'POST', {email});

    const sessionUrl = res?.sessionUrl || '';

    return {sessionUrl, email, recoveryRemaining: recovery_hashes.length, key: api_key, API: api_access, OTP: !!totp};
  })
  .get('/otp', async ({user}) => {
    const result = (await sql`SELECT username FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const username = result[0].username;

    const secret = getSecret();
    const totp = createTOTP(secret, username);
    const uri = totp.toString();

    return {uri, secret};
  })
  .post('/recovery', async ({set, body, user}) => {
    const {password, err} = check(body, ['password'], true);
    if (err || typeof password !== 'string') return error(set, 400, err || 'Password is required');

    const accounts = (await sql`SELECT * FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const account = accounts[0];
    if (!account?.totp) return error(set, 400, 'Enable two-factor authentication first');
    if (!(await compareHash(password, account.password))) return error(set, 400, 'Incorrect password');

    const recovery = getRecovery();
    const updated = await sql`UPDATE users SET recovery_hashes = ${recovery.map(hashRecoveryCode)}
      WHERE email = ${user!.email} AND password = ${account.password} AND totp = ${account.totp} RETURNING email`;
    if (!updated.length) return error(set, 409, 'Account changed. Please try again');

    return {recovery, recoveryRemaining: recovery.length};
  })
  .get('/api-access', async ({user}) => {
    const access = (await sql`SELECT api_access FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const toggle = !access[0].api_access;

    await sql`UPDATE users SET api_access = ${toggle} WHERE email = ${user!.email}`;

    return {API: toggle};
  })
  .get('/api-key', async ({set, user}) => {
    const access = (await sql`SELECT api_access FROM users WHERE email = ${user!.email}`) as QueryUser[];
    if (!access[0].api_access) return error(set, 400, 'API access is disabled. Enable it to proceed');

    const key = getAPIKey();
    await sql`UPDATE users SET api_key = ${key} WHERE email = ${user!.email}`;

    return {key};
  })
  .get('/revoke', async ({user}) => {
    await sql`UPDATE users SET sessions = ARRAY[]::varchar(8)[] WHERE email = ${user!.email}`;
  })
  .post('/otp', async ({set, body, user}) => {
    const {err, secret, token} = check(body, ['secret', 'token']);
    if (err) return error(set, 400, err);
    if (createTOTP(secret, 'temporarily').generate() !== token) {
      return error(set, 400, 'Incorrect verification code. Please try again');
    }

    const recovery = getRecovery();
    await sql`UPDATE users SET totp = ${secret}, recovery_hashes = ${recovery.map(hashRecoveryCode)} WHERE email = ${user!.email}`;

    return {recovery, recoveryRemaining: recovery.length};
  })
  .post('/payment', async ({set, body, user}) => {
    const {err, payment} = check(body, ['payment']);
    if (err) return error(set, 400, err);

    const email = user!.email;
    await request('/billing/fiat/customer', 'PUT', {email, payment});

    const res = await request('/billing/fiat/portal', 'POST', {email});

    return {sessionUrl: res.sessionUrl || ''};
  })
  .post('/email', async ({set, user, jwt, body}) => {
    const {err, email, access} = check(body, ['email', 'access'], true);
    if (err) return error(set, 400, err);

    if (!consumeEmailCode('change', email, `${user!.email}:${user!.id}`, access)) {
      return error(set, 400, 'Invalid or expired email code. Request a new code if needed');
    }

    const existing = await sql`SELECT email FROM users WHERE email = ${email}`;
    if (existing.length) return error(set, 409, 'Email address is already registered');

    await request('/billing/fiat/customer', 'PATCH', {oldEmail: user!.email, email});
    await sql`UPDATE users SET email = ${email} WHERE email = ${user!.email}`;

    const cookievalue = await jwt.sign({email, id: user!.id});

    return {cookie: cookievalue};
  })
  .put('/email', async ({set, body, user}) => {
    const {err, email} = check(body, ['email']);
    if (err) return error(set, 400, err);

    const result = (await sql`SELECT * FROM users WHERE email = ${email}`) as QueryUser[];
    if (result.length) return error(set, 400, 'Email address is already registered on our systems');

    const response = await sendVerificationCode('change', email, `${user!.email}:${user!.id}`);
    if (response.status !== 200) return error(set, response.status, response.message);

    return {email};
  })
  .put('/username', async ({set, user, body}) => {
    const {err, username} = check(body, ['username']);
    if (err) return error(set, 400, err);

    await sql`UPDATE users SET username = ${username} WHERE email = ${user!.email}`;
  })
  .put('/password', async ({set, user, body}) => {
    const {err, password} = check(body, ['password']);
    if (err) return error(set, 400, err);

    const hashedPassword = await createHash(password);
    await sql`UPDATE users SET password = ${hashedPassword} WHERE email = ${user!.email}`;
  })
  .delete('/otp', async ({user}) => {
    await sql`UPDATE users SET totp = NULL, recovery_hashes = ARRAY[]::varchar(64)[] WHERE email = ${user!.email}`;

    return {recoveryRemaining: 0};
  })
  .delete('/full', async ({user}) => {
    const account = (await sql`SELECT id FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const allPurchases = (await sql`SELECT * FROM identities WHERE owner = ${account?.[0].id}`) as QueryIdentity[];

    for (const purchase of allPurchases) {
      await request('/billing/cancel', 'DELETE', {id: purchase.id});
    }

    await request('/billing/fiat/customer', 'DELETE', {email: user!.email});
    await sql`DELETE FROM users WHERE email = ${user!.email}`;
  });
