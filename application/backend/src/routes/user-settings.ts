import {deleteIdentity} from '@core/identity-service';
import {consumeEmailCode, claimSensitiveAttempt} from '@core/states';
import {createTOTP, getSecret, getAPIKey, createHash, getRecovery, hashRecoveryCode, compareHash} from '@utils/cryptography';
import middlewareBase from '@middlewares/middleware-base';
import {sendVerificationCode} from '@utils/email-smtp';
import type {QueryUser, QueryIdentity} from '@type';
import {error} from '@utils/utils';
import {check} from '@utils/checks';
import {sql, stripe, billingPortal, createBillingCustomer} from '@core/services';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/settings'})
  .use(middlewareBase)
  .resolve(async ({user, request, body, path}) => {
    if (!user || request.method === 'GET' || /\/(logout|revoke)\/?$/.test(path)) return {verifiedPassword: ''};

    const input = body as Record<string, unknown> | null;
    const password = /\/recovery\/?$/.test(path) ? input?.password : input?.currentPassword;
    if (typeof password !== 'string' || !password || password.length > 256) return {verifiedPassword: ''};
    if (!claimSensitiveAttempt(user.email)) return {verifiedPassword: '', passwordLimited: true};

    const accounts = (await sql`SELECT password FROM users WHERE email = ${user.email} AND ${user.id} = ANY(sessions)`) as QueryUser[];
    const account = accounts[0];
    const verifiedPassword = account && (await compareHash(password, account.password)) ? account.password : '';

    return {verifiedPassword};
  })
  .onBeforeHandle(({set, user, request, path, verifiedPassword, passwordLimited}) => {
    set.headers['cache-control'] = 'no-store';
    if (!user) return error(set, 401, 'You are not logged in');
    if (request.method === 'GET' || /\/(logout|revoke)\/?$/.test(path)) return;
    if (passwordLimited) return error(set, 429, 'Too many password checks. Please wait five minutes');
    if (!verifiedPassword) return error(set, 403, 'Current password is required and must be correct');
  })
  .get('/', async ({user}) => {
    const result = (await sql`SELECT * FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const {email, recovery_hashes, totp, api_access} = result[0];

    return {email, recoveryRemaining: recovery_hashes.length, key: '', API: api_access, OTP: !!totp};
  })
  .post('/portal', async ({user}) => billingPortal(user!.email))
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
  .post('/api-access', async ({user, set, verifiedPassword}) => {
    const updated = await sql`UPDATE users SET api_access = NOT api_access
      WHERE email = ${user!.email} AND password = ${verifiedPassword} AND ${user!.id} = ANY(sessions) RETURNING api_access`;
    if (!updated.length) return error(set, 409, 'Account changed. Sign in and try again');

    return {API: updated[0].api_access};
  })
  .post('/api-key', async ({set, user, verifiedPassword}) => {
    const access = (await sql`SELECT api_access FROM users WHERE email = ${user!.email}`) as QueryUser[];
    if (!access[0].api_access) return error(set, 400, 'API access is disabled. Enable it to proceed');

    const key = getAPIKey();
    const updated =
      await sql`UPDATE users SET api_key = ${key} WHERE email = ${user!.email} AND password = ${verifiedPassword} AND ${user!.id} = ANY(sessions) RETURNING email`;
    if (!updated.length) return error(set, 409, 'Account changed. Sign in and try again');

    return {key};
  })
  .post('/logout', async ({user}) => {
    await sql`UPDATE users SET sessions = ARRAY_REMOVE(sessions, ${user!.id}) WHERE email = ${user!.email}`;

    return {success: true};
  })
  .post('/revoke', async ({set, user, body}) => {
    const id = (body as {id?: unknown} | null)?.id;
    if (id !== undefined && typeof id !== 'string') return error(set, 400, 'Invalid session');

    if (id) await sql`UPDATE users SET sessions = ARRAY_REMOVE(sessions, ${id}) WHERE email = ${user!.email}`;
    else await sql`UPDATE users SET sessions = ARRAY[]::varchar(64)[] WHERE email = ${user!.email}`;

    return {success: true};
  })
  .get('/sessions', async ({user}) => {
    const accounts = await sql`SELECT sessions FROM users WHERE email = ${user!.email}`;

    return {sessions: accounts[0].sessions.map((id: string) => ({id, current: id === user!.id}))};
  })
  .post('/otp', async ({set, body, user, verifiedPassword}) => {
    const {err, secret, token} = check(body, ['secret', 'token']);
    if (err) return error(set, 400, err);
    if (createTOTP(secret, 'temporarily').generate() !== token) {
      return error(set, 400, 'Incorrect verification code. Please try again');
    }

    const recovery = getRecovery();
    const updated =
      await sql`UPDATE users SET totp = ${secret}, recovery_hashes = ${recovery.map(hashRecoveryCode)} WHERE email = ${user!.email} AND password = ${verifiedPassword} AND ${user!.id} = ANY(sessions) RETURNING email`;
    if (!updated.length) return error(set, 409, 'Account changed. Sign in and try again');

    return {recovery, recoveryRemaining: recovery.length};
  })
  .post('/payment', async ({set, body, user}) => {
    const {err, payment} = check(body, ['payment']);
    if (err) return error(set, 400, err);

    const email = user!.email;
    const customer = await createBillingCustomer(email);
    await stripe.paymentMethods.attach(payment, {customer});
    await stripe.customers.update(customer, {invoice_settings: {default_payment_method: payment}});

    return await billingPortal(email);
  })
  .post('/email', async ({set, user, jwt, body, verifiedPassword}) => {
    const {err, email, access} = check(body, ['email', 'access'], true);
    if (err) return error(set, 400, err);

    if (!consumeEmailCode('change', email, `${user!.email}:${user!.id}`, access)) {
      return error(set, 400, 'Invalid or expired email code. Request a new code if needed');
    }

    const existing = await sql`SELECT email FROM users WHERE email = ${email}`;
    if (existing.length) return error(set, 409, 'Email address is already registered');

    const accounts = await sql`UPDATE users SET email = ${email}, sessions = ARRAY[${user!.id}]::varchar(64)[]
      WHERE email = ${user!.email} AND password = ${verifiedPassword} AND ${user!.id} = ANY(sessions) RETURNING stripe_customer`;
    if (!accounts.length) return error(set, 409, 'Account changed. Sign in and try again');

    let warning;
    if (accounts[0].stripe_customer) {
      try {
        await stripe.customers.update(accounts[0].stripe_customer, {email});
      } catch {
        warning = 'Email changed. Billing email will be synchronized when you next open billing settings';
      }
    }
    const cookievalue = await jwt.sign({email, id: user!.id});

    return {cookie: cookievalue, warning};
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
  .put('/username', async ({set, user, body, verifiedPassword}) => {
    const {err, username} = check(body, ['username']);
    if (err) return error(set, 400, err);

    const updated =
      await sql`UPDATE users SET username = ${username} WHERE email = ${user!.email} AND password = ${verifiedPassword} AND ${user!.id} = ANY(sessions) RETURNING email`;
    if (!updated.length) return error(set, 409, 'Account changed. Sign in and try again');
  })
  .put('/password', async ({set, user, body, verifiedPassword}) => {
    const {err, password} = check(body, ['password']);
    if (err) return error(set, 400, err);

    const hashedPassword = await createHash(password);
    const updated = await sql`UPDATE users SET password = ${hashedPassword}, sessions = ARRAY[]::varchar(64)[], api_key = ${getAPIKey()}
      WHERE email = ${user!.email} AND password = ${verifiedPassword} AND ${user!.id} = ANY(sessions) RETURNING email`;
    if (!updated.length) return error(set, 409, 'Account changed. Sign in and try again');

    return {success: true};
  })
  .delete('/otp', async ({user, verifiedPassword, set}) => {
    const updated =
      await sql`UPDATE users SET totp = NULL, recovery_hashes = ARRAY[]::varchar(64)[] WHERE email = ${user!.email} AND password = ${verifiedPassword} AND ${user!.id} = ANY(sessions) RETURNING email`;
    if (!updated.length) return error(set, 409, 'Account changed. Sign in and try again');

    return {recoveryRemaining: 0};
  })
  .delete('/full', async ({user, set}) => {
    const account = (await sql`SELECT id FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const allPurchases = (await sql`SELECT * FROM identities WHERE owner = ${account?.[0].id}`) as QueryIdentity[];

    for (const purchase of allPurchases) {
      if (!(await deleteIdentity(purchase.id, account[0].id)))
        return error(set, 202, 'Deletion is pending refund or resource cleanup. It will retry automatically');
    }

    const customer = await sql`SELECT stripe_customer FROM users WHERE email = ${user!.email}`;
    if (customer[0]?.stripe_customer) await stripe.customers.del(customer[0].stripe_customer);
    await sql`DELETE FROM users WHERE email = ${user!.email}`;
  });
