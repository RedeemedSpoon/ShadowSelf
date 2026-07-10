import {createTOTP, getSecret, getAPIKey, createHash, getRecovery, compareHash} from '@utils/cryptography';
import middlewareBase from '@middlewares/middleware-base';
import {sendOfficialEmail} from '@utils/email-smtp';
import {consumeEmailCode, createEmailCode} from '@utils/email-codes';
import {deleteAccountBilling, getBillingPortalSession, updateStripeCustomerEmail, updateStripeCustomerPayment} from '@core/billing';
import type {QueryUser, User} from '@type';
import {error} from '@utils/utils';
import {check} from '@utils/checks';
import {sql} from '@core/services';
import {Elysia} from 'elysia';

async function verifyCurrentPassword(set: {[key: string]: unknown}, user: User, currentPassword: string) {
  if (!user) return error(set, 401, 'You are not logged in');

  const account = ((await sql`SELECT password FROM users WHERE email = ${user.email}`) as QueryUser[])[0];
  if (!account) return error(set, 404, 'Account not found');

  const isValid = await compareHash(currentPassword, account.password);
  if (!isValid) return error(set, 401, 'Current password is incorrect');
}

export default new Elysia({prefix: '/settings'})
  .use(middlewareBase)
  .onBeforeHandle(({set, user, path}) => {
    const relativePath = path.slice(9);
    const paths = ['', '/revoke', '/otp', '/otp-check', '/recovery', '/payment', '/api-access', '/api-key', '/full'];
    const mustLogIn = [...paths, '/email', '/username', '/password'];

    if (mustLogIn.some((p) => relativePath === p || relativePath === p + '/') && !user) {
      return error(set, 401, 'You are not logged in');
    }
  })
  .get('/', async ({user}) => {
    const result = (await sql`SELECT * FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const {email, recovery, totp, api_access, api_key} = result[0];

    const sessionUrl = await getBillingPortalSession(email);

    return {sessionUrl, email, recovery: recovery || [], key: api_key, API: api_access, OTP: !!totp};
  })
  .get('/otp', async ({user}) => {
    const result = (await sql`SELECT username FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const username = result[0].username;

    const secret = getSecret();
    const totp = createTOTP(secret, username);
    const uri = totp.toString();

    return {uri, secret};
  })
  .post('/recovery', async ({set, user, body}) => {
    const {err, currentPassword} = check(body, ['currentPassword']);
    if (err) return error(set, 400, err);

    const passwordError = await verifyCurrentPassword(set, user, currentPassword);
    if (passwordError) return passwordError;

    const otp = (await sql`SELECT totp FROM users WHERE email = ${user!.email}`) as QueryUser[];
    if (!otp[0].totp) return error(set, 400, '2FA is disabled. Enable it to proceed');

    const recoveryCodes = getRecovery();
    await sql`UPDATE users SET recovery = ${recoveryCodes} WHERE email = ${user!.email}`;

    return {recovery: recoveryCodes};
  })
  .post('/api-access', async ({set, user, body}) => {
    const {err, currentPassword} = check(body, ['currentPassword']);
    if (err) return error(set, 400, err);

    const passwordError = await verifyCurrentPassword(set, user, currentPassword);
    if (passwordError) return passwordError;

    const access = (await sql`SELECT api_access FROM users WHERE email = ${user!.email}`) as QueryUser[];
    const toggle = !access[0].api_access;

    await sql`UPDATE users SET api_access = ${toggle} WHERE email = ${user!.email}`;
    return {API: toggle};
  })
  .post('/api-key', async ({set, user, body}) => {
    const {err, currentPassword} = check(body, ['currentPassword']);
    if (err) return error(set, 400, err);

    const passwordError = await verifyCurrentPassword(set, user, currentPassword);
    if (passwordError) return passwordError;

    const access = (await sql`SELECT api_access FROM users WHERE email = ${user!.email}`) as QueryUser[];
    if (!access[0].api_access) return error(set, 400, 'API access is disabled. Enable it to proceed');

    const key = getAPIKey();
    await sql`UPDATE users SET api_key = ${key} WHERE email = ${user!.email}`;
    return {key};
  })
  .post('/revoke', async ({set, user, body}) => {
    const {err, currentPassword} = check(body, ['currentPassword']);
    if (err) return error(set, 400, err);

    const passwordError = await verifyCurrentPassword(set, user, currentPassword);
    if (passwordError) return passwordError;

    await sql`UPDATE users SET sessions = ARRAY[]::varchar(8)[] WHERE email = ${user!.email}`;
  })
  .post('/otp-check', async ({set, body}) => {
    const {err, secret, token} = check(body, ['token', 'secret']);
    if (err) return error(set, 400, err);

    const totp = createTOTP(secret, 'temporarily');
    const isValid = totp.generate() === token;

    if (!isValid) return error(set, 400, 'Incorrect validation token. Please try again');
  })
  .post('/otp', async ({set, body, user}) => {
    const {err, secret, currentPassword} = check(body, ['secret', 'currentPassword']);
    if (err) return error(set, 400, err);

    const passwordError = await verifyCurrentPassword(set, user, currentPassword);
    if (passwordError) return passwordError;

    const recoveryCodes = getRecovery();
    await sql`UPDATE users SET totp = ${secret}, recovery = ${recoveryCodes} WHERE email = ${user!.email}`;

    return {recovery: recoveryCodes};
  })
  .post('/payment', async ({set, body, user}) => {
    const {err, payment} = check(body, ['payment']);
    if (err) return error(set, 400, err);

    const email = user!.email;
    await updateStripeCustomerPayment(email, payment);
    const sessionUrl = await getBillingPortalSession(email);

    return {sessionUrl};
  })
  .post('/email', async ({set, user, jwt, body}) => {
    const {err, email, access, currentPassword} = check(body, ['email', 'access', 'currentPassword']);
    if (err) return error(set, 400, err);

    const passwordError = await verifyCurrentPassword(set, user, currentPassword);
    if (passwordError) return passwordError;

    const hasValidCode = await consumeEmailCode(email, access, 'change');
    if (!hasValidCode) return error(set, 400, 'Invalid or expired access code. Please try again');

    await updateStripeCustomerEmail(user!.email, email);
    await sql`UPDATE users SET email = ${email} WHERE email = ${user!.email}`;

    const cookievalue = await jwt.sign({email, id: user!.id});
    return {cookie: cookievalue};
  })
  .put('/email', async ({set, body}) => {
    const {err, email} = check(body, ['email']);
    if (err) return error(set, 400, err);

    const result = (await sql`SELECT * FROM users WHERE email = ${email}`) as QueryUser[];
    if (result.length) return error(set, 400, 'Email address is already registered on our systems');

    const accessCode = await createEmailCode(email, 'change');
    const response = await sendOfficialEmail(email, accessCode, 'change');
    if (response.err) return error(set, 500, 'Failed to send verification email. Try later');

    return {email};
  })
  .put('/username', async ({set, user, body}) => {
    const {err, username} = check(body, ['username']);
    if (err) return error(set, 400, err);

    await sql`UPDATE users SET username = ${username} WHERE email = ${user!.email}`;
  })
  .put('/password', async ({set, user, body}) => {
    const {err, password, currentPassword} = check(body, ['password', 'currentPassword']);
    if (err) return error(set, 400, err);

    const passwordError = await verifyCurrentPassword(set, user, currentPassword);
    if (passwordError) return passwordError;

    const hashedPassword = await createHash(password);
    await sql`UPDATE users SET password = ${hashedPassword} WHERE email = ${user!.email}`;
  })
  .delete('/otp', async ({set, user, body}) => {
    const {err, currentPassword} = check(body, ['currentPassword']);
    if (err) return error(set, 400, err);

    const passwordError = await verifyCurrentPassword(set, user, currentPassword);
    if (passwordError) return passwordError;

    await sql`UPDATE users SET totp = NULL WHERE email = ${user!.email}`;
    await sql`UPDATE users SET recovery = ARRAY[]::varchar(9)[] WHERE email = ${user!.email}`;
  })
  .delete('/full', async ({set, user, body}) => {
    const {err, currentPassword} = check(body, ['currentPassword']);
    if (err) return error(set, 400, err);

    const passwordError = await verifyCurrentPassword(set, user, currentPassword);
    if (passwordError) return passwordError;

    const account = ((await sql`SELECT id, email FROM users WHERE email = ${user!.email}`) as QueryUser[])[0];
    if (!account) return error(set, 404, 'Account not found');

    await deleteAccountBilling(account);
  });
