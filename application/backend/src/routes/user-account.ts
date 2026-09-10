import {issueLoginChallenge, claimLoginChallenge, finishLoginChallenge} from '@core/states';
import {compareHash, createHash, generateID, createTOTP, getAPIKey, getSecret, getRecovery, checksum} from '@utils/cryptography';
import middlewareBase from '@middlewares/middleware-base';
import {sendOfficialEmail} from '@utils/email-smtp';
import {request, error} from '@utils/utils';
import type {QueryUser} from '@type';
import {check} from '@utils/checks';
import {sql} from '@core/services';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/account'})
  .use(middlewareBase)
  .onBeforeHandle(({set, user, path}) => {
    const relativePath = path.slice(8);
    const signUp = ['/signup', 'signup-email', '/signup-username', '/signup-otp', '/signup-recovery', '/signup-create'];
    const otherPaths = ['/login', '/login-email', '/login-otp', '/login-recovery', '/recovery-remaining'];
    const mustNotLogIn = [...signUp, ...otherPaths];

    if (mustNotLogIn.some((p) => relativePath === p || relativePath === p + '/') && user) {
      return error(set, 401, 'You are already logged in');
    }
  })
  .get('/', async ({set, user}) => {
    if (!user) return error(set, 401, 'You are not logged in');

    const result = (await sql`SELECT sessions, username FROM users WHERE email = ${user!.email}`) as QueryUser[];
    if (!result[0].sessions.includes(user!.id)) return error(set, 401, 'Not authorized');
    return result[0].username;
  })
  .get('/recovery-remaining', async ({user}) => {
    const result = (await sql`SELECT recovery FROM users WHERE email = ${user!.email}`) as QueryUser[];
    return result[0]?.recovery.length;
  })
  .post('/login', async ({set, jwt, body}) => {
    const {password, email, err} = check(body, ['password', 'email'], true);
    if (err) return error(set, 400, err);

    const result = (await sql`SELECT * FROM users WHERE email = ${email}`) as QueryUser[];
    if (!result.length) return error(set, 400, 'Invalid credentials. Please try again');

    const hashedPassword = result[0].password;
    const isPasswordCorrect = await compareHash(password, hashedPassword);
    if (!isPasswordCorrect) return error(set, 400, 'Invalid credentials. Please try again');

    const has2fa = result[0].totp;
    if (has2fa) return issueLoginChallenge(result[0]) || error(set, 503, 'Login is busy. Please try again later');

    const id = generateID();
    await sql`UPDATE users SET sessions = ARRAY_APPEND(sessions, ${id}) WHERE email = ${email}`;

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  })
  .post('/login-email', async ({set, body}) => {
    const {email, err} = check(body, ['email']);
    if (err) return error(set, 400, err);

    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!result.length) return error(set, 400, 'Email address is not registered on our systems');

    const accessToken = checksum(email);
    const response = await sendOfficialEmail(email, accessToken, 'recover');
    if (response.err) return error(set, 500, 'Failed to send verification email. Try later');

    return {email};
  })
  .post('/login-access', async ({set, body, jwt}) => {
    const {email, access, err} = check(body, ['email', 'access']);
    if (err) return error(set, 400, err);

    const result = (await sql`SELECT * FROM users WHERE email = ${email}`) as QueryUser[];
    if (!result.length) return error(set, 400, 'Email address is not registered on our systems');

    const accessToken = checksum(email);
    if (access !== accessToken) return error(set, 400, 'Invalid access token. Please Try again');

    const has2fa = result[0].totp;
    if (has2fa) return issueLoginChallenge(result[0]) || error(set, 503, 'Login is busy. Please try again later');

    const id = generateID();
    await sql`UPDATE users SET sessions = ARRAY_APPEND(sessions, ${id}) WHERE email = ${email}`;

    const cookievalue = await jwt.sign({email, id});
    return {cookie: cookievalue};
  })
  .post('/login-otp', ({set, body, jwt}) => completeSecondFactor(body, set, jwt, false))
  .post('/login-recovery', ({set, body, jwt}) => completeSecondFactor(body, set, jwt, true))
  .post('/signup', async ({set, body}) => {
    const {email, err} = check(body, ['email', 'password']);
    if (err) return error(set, 400, err);

    const isTaken = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (isTaken.length) return error(set, 409, 'This email is already taken');

    const accessToken = checksum(email);
    const response = await sendOfficialEmail(email, accessToken, 'confirm');

    if (response.err) return error(set, 500, 'Failed to send verification email. Try later');

    return {email};
  })
  .post('/signup-email', async ({set, body}) => {
    const {email, access, err} = check(body, ['email', 'access']);
    if (err) return error(set, 400, err);

    const accessToken = checksum(email);
    if (access !== accessToken) return error(set, 400, 'Invalid access token. Please Try again');

    return {email};
  })
  .post('/signup-username', async ({set, body}) => {
    const {username, err} = check(body, ['username']);
    return err ? error(set, 400, err) : {username};
  })
  .post('/signup-otp', async ({set, body}) => {
    const {username, err} = check(body, ['username'], true);
    if (err) return error(set, 400, err);

    const secret = getSecret();
    const totp = createTOTP(secret, username);
    const uri = totp.toString();

    return {uri, secret};
  })
  .post('/signup-recovery', async ({set, body}) => {
    const {token, secret, err} = check(body, ['secret', 'token']);
    if (err) return error(set, 400, err);

    const totp = createTOTP(secret, 'temporarily');
    const isValid = totp.generate() === token;
    if (!isValid) return error(set, 400, 'Incorrect validation token. Please try again');

    const recovery = getRecovery();
    return {recovery};
  })
  .post('/signup-create', async ({set, jwt, body}) => {
    const fields = ['username', 'password', 'email', 'access', '?secret', '?recovery', '?payment'];
    const {password, username, email, access, secret, recovery, payment, err} = check(body, fields);
    if (err) return error(set, 400, err);

    const accessToken = checksum(email);
    if (access !== accessToken) return error(set, 400, 'Invalid access token');

    const isTaken = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (isTaken.length) return error(set, 409, 'This email is already taken');

    const newPassword = await createHash(password);
    await sql`INSERT INTO users (email, username, password) VALUES (${email}, ${username}, ${newPassword})`;

    const apiKey = getAPIKey();
    await sql`UPDATE users SET api_key = ${apiKey} WHERE email = ${email}`;

    if (secret && recovery.length) {
      await sql`UPDATE users SET totp = ${secret} WHERE email = ${email}`;
      await sql`UPDATE users SET recovery = ${recovery} WHERE email = ${email}`;
    }

    const id = generateID();
    await sql`UPDATE users SET sessions = ARRAY_APPEND(sessions, ${id}) WHERE email = ${email}`;
    await request('/billing/fiat/customer', 'POST', {email, payment});

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  });

async function completeSecondFactor(
  body: unknown,
  set: Parameters<typeof error>[0],
  jwt: {sign: (payload: {email: string; id: string}) => Promise<string>},
  recovery: boolean,
) {
  const input = body as {challenge?: unknown; token?: unknown; code?: unknown} | null;
  const challenge = input?.challenge;
  const entry = claimLoginChallenge(challenge);
  if (!entry) return error(set, 401, 'Login expired or unavailable. Start again');

  try {
    const value = recovery ? input?.code : input?.token;
    if (typeof value !== 'string' || !(recovery ? /^\d{9}$/ : /^\d{6}$/).test(value)) {
      return error(set, 400, 'Incorrect verification code. Please try again');
    }
    const users = (await sql`SELECT * FROM users WHERE email = ${entry.email}`) as QueryUser[];
    const account = users[0];
    if (!account?.totp || account.password !== entry.password || account.totp !== entry.totp) {
      finishLoginChallenge(challenge as string, entry, true);
      return error(set, 401, 'Login expired or unavailable. Start again');
    }
    const valid = recovery ? account.recovery?.includes(value) : createTOTP(account.totp, 'temporarily').generate() === value;
    if (!valid) return error(set, 400, 'Incorrect verification code. Please try again');
    if (!finishLoginChallenge(challenge as string, entry, true)) {
      return error(set, 401, 'Login expired or unavailable. Start again');
    }
    const id = generateID();
    const updated = recovery
      ? await sql`UPDATE users SET recovery = ARRAY_REMOVE(recovery, ${value}), sessions = ARRAY_APPEND(sessions, ${id})
          WHERE email = ${entry.email} AND password = ${entry.password} AND totp = ${entry.totp}
          AND ${value} = ANY(recovery) RETURNING email`
      : await sql`UPDATE users SET sessions = ARRAY_APPEND(sessions, ${id})
          WHERE email = ${entry.email} AND password = ${entry.password} AND totp = ${entry.totp} RETURNING email`;
    if (!updated.length) return error(set, 401, 'Login expired or unavailable. Start again');
    return {cookie: await jwt.sign({email: entry.email, id})};
  } finally {
    finishLoginChallenge(challenge as string, entry, false);
  }
}
