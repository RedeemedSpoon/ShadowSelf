import {billingPortal, createBillingCustomer} from '@core/stripe-service';
import {deleteAccount} from '@core/identity-service';
import {consumeEmailCode, claimSensitiveAttempt} from '@core/states';
import {createTOTP, getSecret, createHash, getRecovery, hashRecoveryCode, compareHash} from '@utils/cryptography';
import {apiToken, encryptSecret, tokenHash} from '@core/security';
import {issueSession} from '@middlewares/session-auth';
import middlewareBase from '@middlewares/middleware-base';
import {sendVerificationCode} from '@utils/email-smtp';
import type {QueryUser} from '@type';
import {error} from '@utils/utils';
import {check} from '@utils/checks';
import {sql, stripe} from '@core/services';
import {Elysia} from 'elysia';
import {UUID_PATTERN} from '@core/constants';

export default new Elysia({prefix: '/api/settings'})
  .use(middlewareBase)
  .guard({authenticated: true})
  .resolve(async ({user, request, body, path}) => {
    if (
      !user ||
      request.method === 'GET' ||
      /\/(username|api-access|api-key|sessions?|billing-portal|payment(?:-setup)?)\/?$/.test(path)
    ) {
      return {verifiedPassword: ''};
    }

    const input = body as Record<string, unknown> | null;
    const password = /\/recovery\/?$/.test(path) ? input?.password : input?.currentPassword;

    if (typeof password !== 'string' || !password || password.length > 256) {
      return {verifiedPassword: ''};
    }

    if (!claimSensitiveAttempt(user.email)) {
      return {verifiedPassword: '', passwordLimited: true};
    }

    const accounts = (await sql`SELECT password FROM users WHERE id = ${user.accountID}`) as QueryUser[];

    const account = accounts[0];

    return {verifiedPassword: account && (await compareHash(password, account.password)) ? account.password : ''};
  })
  .onBeforeHandle(({set, request, path, verifiedPassword, passwordLimited}) => {
    set.headers['cache-control'] = 'no-store';

    if (
      request.method === 'GET' ||
      /\/(username|api-access|api-key|sessions?|billing-portal|payment(?:-setup)?)\/?$/.test(path)
    ) {
      return;
    }

    if (passwordLimited) {
      return error(set, 429, 'Too many password checks. Wait five minutes');
    }

    if (!verifiedPassword) {
      return error(set, 403, 'Your current password is required');
    }
  })
  .get('/', async ({user}) => {
    const rows =
      (await sql`SELECT email, username, recovery_hashes, totp, api_access, api_key, api_key_suffix FROM users WHERE id = ${user!.accountID}`) as QueryUser[];
    const {email, username, recovery_hashes, totp, api_access, api_key, api_key_suffix} = rows[0];

    const refunds = await sql`SELECT c.id, c.requested_at AS "requestedAt", c.error_code AS "errorCode"
      FROM stripe_cleanup c JOIN users u ON u.stripe_customer = c.customer_id
      WHERE u.id = ${user!.accountID} AND c.refund_requested ORDER BY c.requested_at DESC`;

    const cryptoRefunds =
      await sql`SELECT id, requested_at AS "requestedAt", error_code AS "errorCode", xmr_amount AS "xmrAmount"
      FROM crypto_refunds WHERE owner = ${user!.accountID} ORDER BY requested_at DESC`;

    return {
      email,
      username,
      recoveryRemaining: recovery_hashes.length,
      API: api_access,
      hasApiKey: !!api_key,
      apiKeySuffix: api_key_suffix,
      OTP: !!totp,
      refunds,
      cryptoRefunds,
    };
  })
  .post('/billing-portal', ({user}) => billingPortal(user!.email))
  .get('/totp', async ({user}) => {
    const rows = await sql`SELECT username FROM users WHERE id = ${user!.accountID}`;

    const secret = getSecret();

    return {uri: createTOTP(secret, rows[0].username).toString(), secret};
  })
  .post('/recovery', async ({set, user, verifiedPassword}) => {
    const rows = await sql`SELECT totp FROM users WHERE id = ${user!.accountID}`;

    if (!rows[0]?.totp) {
      return error(set, 400, 'Enable two-factor authentication first');
    }

    const recovery = getRecovery();
    const updated = await sql`UPDATE users SET recovery_hashes = ${recovery.map(hashRecoveryCode)}
      WHERE id = ${user!.accountID} AND password = ${verifiedPassword} AND totp = ${rows[0].totp} RETURNING id`;

    if (!updated.length) {
      return error(set, 409, 'Account changed. Try again');
    }

    return {recovery, recoveryRemaining: recovery.length};
  })
  .put('/api-access', async ({user, set, body}) => {
    const enabled = (body as {enabled?: unknown})?.enabled;

    if (typeof enabled !== 'boolean') {
      return error(set, 400, 'API access must be enabled or disabled explicitly');
    }

    const updated = await sql`UPDATE users SET api_access = ${enabled}
      WHERE id = ${user!.accountID} RETURNING api_access`;

    if (!updated.length) {
      return error(set, 409, 'Account changed. Try again');
    }

    return {API: updated[0].api_access};
  })
  .post('/api-key', async ({set, user}) => {
    const key = apiToken();
    const updated = await sql`UPDATE users SET api_key = ${tokenHash(key)}, api_key_suffix = ${key.slice(-6)}
      WHERE id = ${user!.accountID} AND api_access = true RETURNING id`;

    if (!updated.length) {
      return error(set, 409, 'Enable API access before creating a key');
    }

    return {key};
  })
  .delete('/session', async ({user}) => {
    await sql`DELETE FROM sessions WHERE id = ${user!.id} AND owner = ${user!.accountID}`;

    return {success: true};
  })
  .delete('/sessions', async ({set, user, body}) => {
    const id = (body as {id?: unknown} | null)?.id;

    if (id !== undefined && (typeof id !== 'string' || !UUID_PATTERN.test(id))) {
      return error(set, 400, 'Invalid session');
    }

    if (id) {
      await sql`DELETE FROM sessions WHERE id = ${id as string} AND owner = ${user!.accountID}`;
    } else {
      await sql`DELETE FROM sessions WHERE owner = ${user!.accountID}`;
    }

    return {success: true};
  })
  .get('/sessions', async ({user}) => {
    const rows =
      await sql`SELECT id, created_at, expires_at FROM sessions WHERE owner = ${user!.accountID} AND expires_at > NOW() ORDER BY created_at DESC`;

    return {
      sessions: rows.map((session) => ({
        id: session.id,
        current: session.id === user!.id,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
      })),
    };
  })
  .post('/totp', async ({set, body, user, verifiedPassword}) => {
    const {err, secret, token} = check(body, ['secret', 'token']);

    if (err) {
      return error(set, 400, err);
    }

    const delta = createTOTP(secret, 'temporary').validate({token, window: 1});

    if (delta === null) {
      return error(set, 400, 'Incorrect verification code');
    }

    const recovery = getRecovery();
    const updated =
      await sql`UPDATE users SET totp = ${encryptSecret(secret)}, totp_counter = ${Math.floor(Date.now() / 30_000) + delta}, recovery_hashes = ${recovery.map(hashRecoveryCode)}
      WHERE id = ${user!.accountID} AND password = ${verifiedPassword} RETURNING id`;

    if (!updated.length) {
      return error(set, 409, 'Account changed. Try again');
    }

    await sql`DELETE FROM sessions WHERE owner = ${user!.accountID} AND id <> ${user!.id}`;

    return {recovery, recoveryRemaining: recovery.length};
  })
  .post('/payment-setup', async ({user}) => {
    const customer = await createBillingCustomer(user!.email);

    const intent = await stripe.setupIntents.create({
      customer,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    return {clientSecret: intent.client_secret};
  })
  .post('/payment', async ({set, body, user}) => {
    const setupIntent = (body as {setupIntent?: unknown})?.setupIntent;

    if (typeof setupIntent !== 'string' || !/^seti_[a-zA-Z0-9]{1,128}$/.test(setupIntent)) {
      return error(set, 400, 'Invalid card setup reference');
    }

    const customer = await createBillingCustomer(user!.email);
    const intent = await stripe.setupIntents.retrieve(setupIntent);

    if (intent.customer !== customer || intent.status !== 'succeeded' || !intent.payment_method) {
      return error(set, 400, 'Complete card verification before saving this payment method');
    }

    const payment = typeof intent.payment_method === 'string' ? intent.payment_method : intent.payment_method.id;

    await stripe.customers.update(customer, {invoice_settings: {default_payment_method: payment}});

    return {success: true};
  })
  .post('/email', async ({set, body, user}) => {
    const {err, email} = check(body, ['email']);

    if (err) {
      return error(set, 400, err);
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;

    if (existing.length) {
      return error(set, 409, 'This email is already registered');
    }

    const response = await sendVerificationCode('change', email, `${user!.email}:${user!.id}`);

    if (response.status !== 200) {
      return error(set, response.status, response.message);
    }

    return {email};
  })
  .put('/email', async ({set, user, body, verifiedPassword}) => {
    const {err, email, access} = check(body, ['email', 'access'], true);

    if (err) {
      return error(set, 400, err);
    }

    if (!consumeEmailCode('change', email, `${user!.email}:${user!.id}`, access)) {
      return error(set, 400, 'Invalid or expired email code');
    }

    const changed = await sql.begin(async (transaction) => {
      const accounts = await transaction`UPDATE users SET email = ${email}
        WHERE id = ${user!.accountID} AND password = ${verifiedPassword} RETURNING email, password, totp, stripe_customer`;

      if (!accounts.length) {
        return;
      }

      await transaction`DELETE FROM sessions WHERE owner = ${user!.accountID}`;

      return {token: await issueSession(accounts[0] as QueryUser, transaction), customer: accounts[0].stripe_customer};
    });

    if (!changed) {
      return error(set, 409, 'Account changed. Try again');
    }

    let warning;

    if (changed.customer) {
      try {
        await stripe.customers.update(changed.customer, {email});
      } catch {
        warning = 'Email changed. Billing email will synchronize when you next open billing settings';
      }
    }

    return {token: changed.token, warning};
  })
  .put('/username', async ({set, user, body}) => {
    const {err, username} = check(body, ['username']);

    if (err) {
      return error(set, 400, err);
    }

    const updated = await sql`UPDATE users SET username = ${username} WHERE id = ${user!.accountID} RETURNING id`;

    if (!updated.length) {
      return error(set, 409, 'Account changed. Try again');
    }

    return {success: true};
  })
  .put('/password', async ({set, user, body, verifiedPassword}) => {
    const {err, password} = check(body, ['password']);

    if (err) {
      return error(set, 400, err);
    }

    const hash = await createHash(password);

    const changed = await sql.begin(async (transaction) => {
      const updated = await transaction`UPDATE users SET password = ${hash}, api_key = NULL, api_key_suffix = NULL
        WHERE id = ${user!.accountID} AND password = ${verifiedPassword} RETURNING id`;

      if (!updated.length) {
        return false;
      }

      await transaction`DELETE FROM sessions WHERE owner = ${user!.accountID}`;

      return true;
    });

    if (!changed) {
      return error(set, 409, 'Account changed. Try again');
    }

    return {success: true};
  })
  .delete('/totp', async ({user, verifiedPassword, set}) => {
    const updated =
      await sql`UPDATE users SET totp = NULL, totp_counter = NULL, recovery_hashes = ARRAY[]::varchar(64)[]
      WHERE id = ${user!.accountID} AND password = ${verifiedPassword} RETURNING id`;

    if (!updated.length) {
      return error(set, 409, 'Account changed. Try again');
    }

    return {recoveryRemaining: 0};
  })
  .delete('/account', async ({user, body}) => {
    await deleteAccount(user!.accountID, (body as {refundAddress?: unknown})?.refundAddress);

    return {success: true};
  });
