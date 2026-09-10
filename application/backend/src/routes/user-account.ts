import {compareHash, createHash, generateID, createTOTP, getAPIKey, getSecret, getRecovery, hashRecoveryCode} from '@utils/cryptography';
import {issueLoginChallenge, claimLoginChallenge, finishLoginChallenge} from '@core/states';
import middlewareBase from '@middlewares/middleware-base';
import {sendVerificationCode} from '@utils/email-smtp';
import {request, error} from '@utils/utils';
import type {QueryUser} from '@type';
import {check} from '@utils/checks';
import {sql} from '@core/services';
import {consumeEmailCode, createSignupDraft, getSignupDraft} from '@core/states';
import {SIGNUP_DRAFT_TTL} from '@core/constants';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/account'})
  .use(middlewareBase)
  .onBeforeHandle(({set, user, path}) => {
    set.headers['cache-control'] = 'no-store';
    const relativePath = path.slice(8);
    const signUp = ['/signup', 'signup-email', '/signup-username', '/signup-otp', '/signup-recovery', '/signup-create'];
    const otherPaths = ['/login', '/login-email', '/login-otp', '/login-recovery', '/login-access'];
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
  .get('/recovery-remaining', async ({user, set}) => {
    if (!user) return error(set, 401, 'You are not logged in');

    const result = (await sql`SELECT recovery_hashes FROM users WHERE email = ${user.email}`) as QueryUser[];

    return result[0]?.recovery_hashes.length ?? 0;
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

    const result = (await sql`SELECT * FROM users WHERE email = ${email}`) as QueryUser[];
    if (!result.length) return error(set, 400, 'Email address is not registered on our systems');

    const response = await sendVerificationCode('recover', email, result[0].password);
    if (response.status !== 200) return error(set, response.status, response.message);

    return {email};
  })
  .post('/login-access', async ({set, body, jwt}) => {
    const {email, access, err} = check(body, ['email', 'access'], true);
    if (err) return error(set, 400, err);

    const result = (await sql`SELECT * FROM users WHERE email = ${email}`) as QueryUser[];
    if (!result.length) return error(set, 400, 'Email address is not registered on our systems');

    if (!consumeEmailCode('recover', email, result[0].password, access)) {
      return error(set, 400, 'Invalid or expired email code. Request a new code if needed');
    }

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
    const {email, password, err} = check(body, ['email', 'password']);
    if (err) return error(set, 400, err);

    const isTaken = await sql`SELECT email FROM users WHERE email = ${email}`;
    if (isTaken.length) return error(set, 409, 'This email is already taken');

    const signup = createSignupDraft(email, await createHash(password));
    if (!signup) return error(set, 503, 'Signup is busy. Please try again later');

    const response = await sendVerificationCode('confirm', email, signup);
    if (response.status !== 200) {
      getSignupDraft(signup, true);

      return error(set, response.status, response.message);
    }

    return {signup, email, expiresIn: SIGNUP_DRAFT_TTL / 1000};
  })
  .post('/signup-email', ({set, body}) => {
    const input = body as {signup?: string; access?: unknown};
    const draft = getSignupDraft(input?.signup);
    if (!draft || draft.verified || !consumeEmailCode('confirm', draft.email, input.signup!, input.access)) {
      return error(set, 400, 'Invalid or expired email code. Start signup again if needed');
    }

    draft.verified = true;

    return {email: draft.email};
  })
  .post('/signup-username', ({set, body}) => {
    const {username, err} = check(body, ['username']);
    const draft = getSignupDraft((body as {signup?: string})?.signup);
    if (!draft?.verified) return error(set, 401, 'Signup expired. Start again');
    if (err) return error(set, 400, err);

    draft.username = username;

    return {username};
  })
  .post('/signup-otp', ({set, body}) => {
    const input = body as {signup?: string; enable?: boolean};
    const draft = getSignupDraft(input?.signup);
    if (!draft?.verified || !draft.username) return error(set, 401, 'Signup expired. Start again');

    draft.recoveryHashes = [];
    draft.secret = input.enable ? getSecret() : '';
    if (!draft.secret) return {secret: ''};

    return {secret: draft.secret, uri: createTOTP(draft.secret, draft.username).toString()};
  })
  .post('/signup-recovery', ({set, body}) => {
    const input = body as {signup?: string; token?: string};
    const draft = getSignupDraft(input?.signup);
    if (!draft?.verified || !draft.secret) return error(set, 401, 'Signup expired. Start again');
    if (draft.recoveryHashes.length) return error(set, 409, 'Recovery codes were already issued');
    if (typeof input.token !== 'string' || createTOTP(draft.secret, 'temporarily').generate() !== input.token) {
      return error(set, 400, 'Incorrect verification code. Please try again');
    }

    const recovery = getRecovery();
    draft.recoveryHashes = recovery.map(hashRecoveryCode);

    return {recovery};
  })
  .post('/signup-create', async ({set, jwt, body}) => {
    const input = body as {signup?: string; payment?: string};
    const draft = getSignupDraft(input?.signup);
    if (!draft?.verified || !draft.username || (draft.secret && !draft.recoveryHashes.length)) {
      return error(set, 401, 'Complete signup verification before creating the account');
    }

    const {err, payment} = check(body, ['?payment']);
    if (err) return error(set, 400, err);
    if (!getSignupDraft(input.signup, true)) return error(set, 401, 'Signup expired. Start again');

    const {email, username, password, secret, recoveryHashes} = draft;
    const id = generateID();
    const inserted = await sql`INSERT INTO users (email, username, password, totp, recovery_hashes, sessions, api_key)
      VALUES (${email}, ${username}, ${password}, ${secret || null}, ${recoveryHashes}, ${[id]}, ${getAPIKey()})
      ON CONFLICT (email) DO NOTHING RETURNING email`;
    if (!inserted.length) return error(set, 409, 'This email is already taken');

    await request('/billing/fiat/customer', 'POST', {email, payment});

    return {cookie: await jwt.sign({email, id})};
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
    if (typeof value !== 'string' || !(recovery ? /^[a-fA-F0-9]{6}(-[a-fA-F0-9]{6}){3}$/ : /^\d{6}$/).test(value)) {
      return error(set, 400, 'Incorrect verification code. Please try again');
    }

    const users = (await sql`SELECT * FROM users WHERE email = ${entry.email}`) as QueryUser[];
    const account = users[0];
    if (!account?.totp || account.password !== entry.password || account.totp !== entry.totp) {
      finishLoginChallenge(challenge as string, entry, true);

      return error(set, 401, 'Login expired or unavailable. Start again');
    }

    const recoveryHash = recovery ? hashRecoveryCode(value) : '';
    const valid = recovery ? account.recovery_hashes?.includes(recoveryHash) : createTOTP(account.totp, 'temporarily').generate() === value;
    if (!valid) return error(set, 400, 'Incorrect verification code. Please try again');
    if (!finishLoginChallenge(challenge as string, entry, true)) {
      return error(set, 401, 'Login expired or unavailable. Start again');
    }

    const id = generateID();
    const updated = recovery
      ? await sql`UPDATE users SET recovery_hashes = ARRAY_REMOVE(recovery_hashes, ${recoveryHash}), sessions = ARRAY_APPEND(sessions, ${id})
          WHERE email = ${entry.email} AND password = ${entry.password} AND totp = ${entry.totp}
          AND ${recoveryHash} = ANY(recovery_hashes) RETURNING email`
      : await sql`UPDATE users SET sessions = ARRAY_APPEND(sessions, ${id})
          WHERE email = ${entry.email} AND password = ${entry.password} AND totp = ${entry.totp} RETURNING email`;
    if (!updated.length) return error(set, 401, 'Login expired or unavailable. Start again');

    return {cookie: await jwt.sign({email: entry.email, id})};
  } finally {
    finishLoginChallenge(challenge as string, entry, false);
  }
}
