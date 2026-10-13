import {issueSession} from '@middlewares/session-auth';
import {encryptSecret} from '@core/security';
import {createBillingCustomer} from '@core/stripe-service';
import {compareHash, createHash, createTOTP, getSecret, getRecovery, hashRecoveryCode} from '@utils/cryptography';
import {issueLoginChallenge, claimLoginChallenge, finishLoginChallenge, claimSensitiveAttempt} from '@core/states';
import middlewareBase from '@middlewares/middleware-base';
import {sendVerificationCode} from '@utils/email-smtp';
import {error} from '@utils/utils';
import type {QueryUser} from '@type';
import {check} from '@utils/checks';
import {sql} from '@core/services';
import {consumeEmailCode, createSignupDraft, getSignupDraft} from '@core/states';
import {SIGNUP_DRAFT_TTL} from '@core/constants';
import {Elysia} from 'elysia';

export function createAccountRoutes(sendCode = sendVerificationCode) {
  return new Elysia({prefix: '/api/auth'})
    .use(middlewareBase)
    .onBeforeHandle(({set, user, path}) => {
      set.headers['cache-control'] = 'no-store';

      const relativePath = path.slice('/api/auth'.length);
      const signUp = [
        '/registration',
        '/registration/email',
        '/registration/profile',
        '/registration/totp',
        '/registration/recovery',
        '/registration/complete',
      ];
      const otherPaths = ['/password', '/email', '/second-factor', '/recovery', '/email/verify'];
      const mustNotLogIn = [...signUp, ...otherPaths];

      if (mustNotLogIn.some((p) => relativePath === p || relativePath === p + '/') && user) {
        return error(set, 401, 'You are already logged in');
      }
    })
    .get('/session', async ({set, user}) => {
      if (!user) {
        return error(set, 401, 'You are not logged in');
      }

      const result = (await sql`SELECT username, email FROM users WHERE email = ${user!.email}`) as QueryUser[];

      return {username: result[0].username, email: result[0].email};
    })
    .get('/recovery-remaining', async ({user, set}) => {
      if (!user) {
        return error(set, 401, 'You are not logged in');
      }

      const result = (await sql`SELECT recovery_hashes FROM users WHERE email = ${user.email}`) as QueryUser[];

      return {recoveryRemaining: result[0]?.recovery_hashes.length ?? 0};
    })
    .post('/password', async ({set, body}) => {
      const {password, email, err} = check(body, ['password', 'email'], true);

      if (err) {
        return error(set, 400, err);
      }

      if (!claimSensitiveAttempt(email)) {
        return error(set, 429, 'Too many sign-in attempts. Wait five minutes');
      }

      const result = (await sql`SELECT * FROM users WHERE email = ${email}`) as QueryUser[];

      if (!result.length) {
        return error(set, 401, 'Invalid credentials');
      }

      const hashedPassword = result[0].password;
      const isPasswordCorrect = await compareHash(password, hashedPassword);

      if (!isPasswordCorrect) {
        return error(set, 401, 'Invalid credentials');
      }

      const has2fa = result[0].totp;

      if (has2fa) {
        return issueLoginChallenge(result[0]) || error(set, 503, 'Login is busy. Please try again later');
      }

      const token = await issueSession(result[0]);

      return {token};
    })
    .post('/email', async ({set, body}) => {
      const {email, err} = check(body, ['email']);

      if (err) {
        return error(set, 400, err);
      }

      const result = (await sql`SELECT * FROM users WHERE email = ${email}`) as QueryUser[];

      if (!result.length) {
        return {email};
      }

      const response = await sendCode('recover', email, result[0].password);

      if (response.status !== 200) {
        return error(set, response.status, response.message);
      }

      return {email};
    })
    .post('/email/verify', async ({set, body}) => {
      const {email, access, err} = check(body, ['email', 'access'], true);

      if (err) {
        return error(set, 400, err);
      }

      const result = (await sql`SELECT * FROM users WHERE email = ${email}`) as QueryUser[];

      if (!result.length) {
        return error(set, 401, 'Invalid or expired email code');
      }

      if (!consumeEmailCode('recover', email, result[0].password, access)) {
        return error(set, 400, 'Invalid or expired email code. Request a new code if needed');
      }

      const has2fa = result[0].totp;

      if (has2fa) {
        return issueLoginChallenge(result[0]) || error(set, 503, 'Login is busy. Please try again later');
      }

      const token = await issueSession(result[0]);

      return {token};
    })
    .post('/second-factor', ({set, body}) => completeSecondFactor(body, set, false))
    .post('/recovery', ({set, body}) => completeSecondFactor(body, set, true))
    .post('/registration', async ({set, body}) => {
      const {email, password, err} = check(body, ['email', 'password']);

      if (err) {
        return error(set, 400, err);
      }

      const isTaken = await sql`SELECT email FROM users WHERE email = ${email}`;

      if (isTaken.length) {
        return error(set, 409, 'This email is already taken');
      }

      const signup = createSignupDraft(email, await createHash(password));

      if (!signup) {
        return error(set, 503, 'Signup is busy. Please try again later');
      }

      const response = await sendCode('confirm', email, signup);

      if (response.status !== 200) {
        getSignupDraft(signup, true);

        return error(set, response.status, response.message);
      }

      return {signup, email, expiresIn: SIGNUP_DRAFT_TTL / 1000};
    })
    .post('/registration/email', ({set, body}) => {
      const input = body as {signup?: string; access?: unknown};
      const draft = getSignupDraft(input?.signup);

      if (!draft || draft.verified || !consumeEmailCode('confirm', draft.email, input.signup!, input.access)) {
        return error(set, 400, 'Invalid or expired email code. Start signup again if needed');
      }

      draft.verified = true;

      return {email: draft.email};
    })
    .put('/registration/profile', ({set, body}) => {
      const {username, err} = check(body, ['username']);
      const draft = getSignupDraft((body as {signup?: string})?.signup);

      if (!draft?.verified) {
        return error(set, 401, 'Signup expired. Start again');
      }

      if (err) {
        return error(set, 400, err);
      }

      draft.username = username;

      return {username};
    })
    .post('/registration/totp', ({set, body}) => {
      const input = body as {signup?: string; enable?: boolean};
      const draft = getSignupDraft(input?.signup);

      if (!draft?.verified || !draft.username) {
        return error(set, 401, 'Signup expired. Start again');
      }

      if (typeof input.enable !== 'boolean') {
        return error(set, 400, 'Choose whether to enable two-factor authentication');
      }

      draft.recoveryHashes = [];
      draft.totpCounter = undefined;
      draft.secret = input.enable ? getSecret() : '';

      if (!draft.secret) {
        return {secret: ''};
      }

      return {secret: draft.secret, uri: createTOTP(draft.secret, draft.username).toString()};
    })
    .post('/registration/recovery', ({set, body}) => {
      const input = body as {signup?: string; token?: string};
      const draft = getSignupDraft(input?.signup);

      if (!draft?.verified || !draft.secret) {
        return error(set, 401, 'Signup expired. Start again');
      }

      if (draft.recoveryHashes.length) {
        return error(set, 409, 'Recovery codes were already issued');
      }

      const delta = typeof input.token === 'string' ? createTOTP(draft.secret, 'temporary').validate({token: input.token, window: 1}) : null;

      if (delta === null) {
        return error(set, 400, 'Incorrect verification code. Please try again');
      }

      const recovery = getRecovery();
      draft.recoveryHashes = recovery.map(hashRecoveryCode);
      draft.totpCounter = Math.floor(Date.now() / 30_000) + delta;

      return {recovery};
    })
    .post('/registration/complete', async ({set, body}) => {
      const input = body as {signup?: string; payment?: string};
      const draft = getSignupDraft(input?.signup);

      if (!draft?.verified || !draft.username || (draft.secret && !draft.recoveryHashes.length)) {
        return error(set, 401, 'Complete signup verification before creating the account');
      }

      const {err, payment} = check(body, ['?payment']);

      if (err) {
        return error(set, 400, err);
      }

      if (!getSignupDraft(input.signup)) {
        return error(set, 401, 'Signup expired. Start again');
      }

      const {email, username, password, secret, recoveryHashes} = draft;
      const inserted = await sql`INSERT INTO users (email, username, password, totp, totp_counter, recovery_hashes, api_key)
      VALUES (${email}, ${username}, ${password}, ${secret ? encryptSecret(secret) : null}, ${draft.totpCounter ?? null}, ${recoveryHashes}, ${null})
      ON CONFLICT (email) DO NOTHING RETURNING email, password, totp`;

      if (!inserted.length) {
        return error(set, 409, 'This email is already taken');
      }

      getSignupDraft(input.signup, true);

      let warning;

      if (payment) {
        try {
          await createBillingCustomer(email, payment);
        } catch {
          warning = 'Account created. Add your payment method in settings when billing is available';
        }
      }

      return {token: await issueSession(inserted[0] as QueryUser), warning};
    });
}

async function completeSecondFactor(body: unknown, set: Parameters<typeof error>[0], recovery: boolean) {
  const input = body as {challenge?: unknown; token?: unknown; code?: unknown} | null;
  const challenge = input?.challenge;
  const entry = claimLoginChallenge(challenge);

  if (!entry) {
    return error(set, 401, 'Login expired or unavailable. Start again');
  }

  try {
    const value = recovery ? input?.code : input?.token;

    if (typeof value !== 'string' || !(recovery ? /^[a-fA-F0-9]{6}(-[a-fA-F0-9]{6}){3}$/ : /^\d{6}$/).test(value)) {
      return error(set, 400, 'Incorrect verification code. Please try again');
    }

    return await sql.begin(async (transaction) => {
      const users = (await transaction`SELECT * FROM users WHERE email = ${entry.email} FOR UPDATE`) as QueryUser[];

      const account = users[0];

      if (!account?.totp || account.password !== entry.password || account.totp !== entry.totp) {
        finishLoginChallenge(challenge as string, entry, true);

        return error(set, 401, 'Login expired or unavailable. Start again');
      }

      const recoveryHash = recovery ? hashRecoveryCode(value) : '';
      const delta = recovery ? null : createTOTP(account.totp, 'temporary').validate({token: value, window: 1});
      const counter = delta === null ? null : Math.floor(Date.now() / 30_000) + delta;
      const valid = recovery
        ? account.recovery_hashes.includes(recoveryHash)
        : counter !== null && (account.totp_counter === null || counter > Number(account.totp_counter));

      if (!valid) {
        return error(set, 400, 'Incorrect or already used verification code. Please try again');
      }

      if (!finishLoginChallenge(challenge as string, entry, true)) {
        return error(set, 401, 'Login expired or unavailable. Start again');
      }

      if (recovery) {
        await transaction`UPDATE users SET recovery_hashes = ARRAY_REMOVE(recovery_hashes, ${recoveryHash}) WHERE id = ${account.id}`;
      } else {
        await transaction`UPDATE users SET totp_counter = ${counter} WHERE id = ${account.id}`;
      }

      return {token: await issueSession(account, transaction)};
    });
  } finally {
    finishLoginChallenge(challenge as string, entry, false);
  }
}
