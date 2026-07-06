import {compareHash, createHash, generateID, createTOTP, getAPIKey, getSecret, getRecovery} from '@utils/cryptography';
import middlewareBase from '@middlewares/middleware-base';
import {sendOfficialEmail} from '@utils/email-smtp';
import {consumeEmailCode, consumeEmailVerification, createEmailCode, createEmailVerification} from '@utils/email-codes';
import {request, error} from '@utils/utils';
import type {QueryUser} from '@type';
import {check} from '@utils/checks';
import {sql} from '@core/services';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/account'})
  .use(middlewareBase)
  .onBeforeHandle(({set, user, path}) => {
    const relativePath = path.slice(8);
    const signUp = ['/signup', '/signup-email', '/signup-username', '/signup-otp', '/signup-recovery', '/signup-create'];
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
    return result[0]?.recovery?.length ?? 0;
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
    if (has2fa) return {email};

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

    const accessCode = await createEmailCode(email, 'login');
    const response = await sendOfficialEmail(email, accessCode, 'recover');
    if (response.err) return error(set, 500, 'Failed to send verification email. Try later');

    return {email};
  })
  .post('/login-access', async ({set, body, jwt}) => {
    const {email, access, err} = check(body, ['email', 'access']);
    if (err) return error(set, 400, err);

    const result = (await sql`SELECT * FROM users WHERE email = ${email}`) as QueryUser[];
    if (!result.length) return error(set, 400, 'Email address is not registered on our systems');

    const hasValidCode = await consumeEmailCode(email, access, 'login');
    if (!hasValidCode) return error(set, 400, 'Invalid or expired access code. Please try again');

    const has2fa = result[0].totp;
    if (has2fa) return {email};

    const id = generateID();
    await sql`UPDATE users SET sessions = ARRAY_APPEND(sessions, ${id}) WHERE email = ${email}`;

    const cookievalue = await jwt.sign({email, id});
    return {cookie: cookievalue};
  })
  .post('/login-otp', async ({set, body, jwt}) => {
    const {token, email, err} = check(body, ['token', 'email'], true);
    if (err) return error(set, 400, err);

    const secret = (await sql`SELECT totp FROM users WHERE email = ${email}`) as QueryUser[];
    if (!secret.length) return error(set, 400, 'Incorrect validation token. Please try again');

    const totp = createTOTP(secret[0].totp, 'temporarily');
    const isValid = totp.generate() === token;
    if (!isValid) return error(set, 400, 'Incorrect validation token. Please try again');

    const id = generateID();
    await sql`UPDATE users SET sessions = ARRAY_APPEND(sessions, ${id}) WHERE email = ${email}`;

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  })
  .post('/login-recovery', async ({set, body, jwt}) => {
    const {code, email, err} = check(body, ['code', 'email'], true);
    if (err) return error(set, 400, err);

    const recovery = (await sql`SELECT recovery FROM users WHERE email = ${email}`) as QueryUser[];
    if (!recovery.length) return error(set, 400, 'Incorrect recovery code. Try another one');

    const allCodes = recovery[0].recovery;
    if (!allCodes.length) return error(set, 400, 'Incorrect recovery code. Try another one');

    const isValid = allCodes.includes(code);
    if (!isValid) return error(set, 400, 'Incorrect recovery code. Try another one');

    const newCodes = allCodes.filter((c) => c !== code);
    await sql`UPDATE users SET recovery = ${newCodes} WHERE email = ${email}`;

    const id = generateID();
    await sql`UPDATE users SET sessions = ARRAY_APPEND(sessions, ${id}) WHERE email = ${email}`;

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  })
  .post('/signup', async ({set, body}) => {
    const {email, err} = check(body, ['email', 'password']);
    if (err) return error(set, 400, err);

    const isTaken = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (isTaken.length) return error(set, 409, 'This email is already taken');

    const accessCode = await createEmailCode(email, 'signup');
    const response = await sendOfficialEmail(email, accessCode, 'confirm');

    if (response.err) return error(set, 500, 'Failed to send verification email. Try later');

    return {email};
  })
  .post('/signup-email', async ({set, body}) => {
    const {email, access, err} = check(body, ['email', 'access']);
    if (err) return error(set, 400, err);

    const verification = await createEmailVerification(email, access, 'signup');
    if (!verification) return error(set, 400, 'Invalid or expired access code. Please try again');

    return {email, verification};
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
    const fields = ['username', 'password', 'email', 'verification', '?secret', '?recovery', '?payment'];
    const {password, username, email, verification, secret, recovery, payment, err} = check(body, fields);
    if (err) return error(set, 400, err);

    const hasVerifiedEmail = await consumeEmailVerification(email, verification, 'signup');
    if (!hasVerifiedEmail) return error(set, 400, 'Invalid or expired email verification');

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
