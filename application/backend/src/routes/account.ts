import {compareHash, createHash, generateID, createTOTP, getAPIKey, getSecret, getRecovery, checksum} from '@utils/crypto';
import {attempt, request, error} from '@utils/utils';
import {sendOfficialEmail} from '@utils/email-smtp';
import {sql} from '@utils/connection';
import middleware from '@middleware';
import {check} from '@utils/checks';
import {Elysia} from 'elysia';

export default new Elysia({prefix: '/account'})
  .use(middleware)
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

    const result = await attempt(sql`SELECT revoke_session, username FROM users WHERE email = ${user!.email}`);
    if (!result[0].revoke_session.includes(user!.id)) return error(set, 401, 'Not authorized');
    return result[0].username;
  })
  .get('/recovery-remaining', async ({user}) => {
    const result = await attempt(sql`SELECT recovery FROM users WHERE email = ${user!.email}`);
    return result[0]?.recovery.length;
  })
  .post('/login', async ({set, jwt, body}) => {
    const {password, email, err} = check(body, ['password', 'email'], true);
    if (err) return error(set, 400, err);

    const result = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (!result.length) return error(set, 400, 'Invalid credentials. Please try again');

    const hashedPassword = result[0].password;
    const isPasswordCorrect = await compareHash(password, hashedPassword);
    if (!isPasswordCorrect) return error(set, 400, 'Invalid credentials. Please try again');

    const has2fa = result[0].totp;
    if (has2fa) return {email};

    const id = generateID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  })
  .post('/login-email', async ({set, body}) => {
    const {email, err} = check(body, ['email']);
    if (err) return error(set, 400, err);

    const result = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (!result.length) return error(set, 400, 'Email address is not registered on our systems');

    const accessToken = checksum(email);
    const response = await sendOfficialEmail(email, accessToken, 'recover');
    if (response.err) return error(set, 500, 'Failed to send verification email. Try later');

    return {email};
  })
  .post('/login-access', async ({set, body, jwt}) => {
    const {email, access, err} = check(body, ['email', 'access']);
    if (err) return error(set, 400, err);

    const result = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (!result.length) return error(set, 400, 'Email address is not registered on our systems');

    const accessToken = checksum(email);
    if (access !== accessToken) return error(set, 400, 'Invalid access token. Please Try again');

    const has2fa = result[0].totp;
    if (has2fa) return {email};

    const id = generateID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);

    const cookievalue = await jwt.sign({email, id});
    return {cookie: cookievalue};
  })
  .post('/login-otp', async ({set, body, jwt}) => {
    const {token, email, err} = check(body, ['token', 'email'], true);
    if (err) return error(set, 400, err);

    const secret = await attempt(sql`SELECT totp FROM users WHERE email = ${email}`);
    if (!secret.length) return error(set, 400, 'Incorrect validation token. Please try again');

    const totp = createTOTP(secret[0].totp, 'temporarily');
    const isValid = totp.generate() === token;
    if (!isValid) return error(set, 400, 'Incorrect validation token. Please try again');

    const id = generateID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  })
  .post('/login-recovery', async ({set, body, jwt}) => {
    const {code, email, err} = check(body, ['code', 'email'], true);
    if (err) return error(set, 400, err);

    const recovery = await attempt(sql`SELECT recovery FROM users WHERE email = ${email}`);
    if (!recovery.length) return error(set, 400, 'Incorrect recovery code. Try another one');

    const allCodes = recovery[0].recovery;
    if (!allCodes.length) return error(set, 400, 'Incorrect recovery code. Try another one');

    const isValid = allCodes.includes(code);
    if (!isValid) return error(set, 400, 'Incorrect recovery code. Try another one');

    const newCodes = allCodes.filter((c) => c !== code);
    await attempt(sql`UPDATE users SET recovery = ${newCodes} WHERE email = ${email}`);

    const id = generateID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  })
  .post('/signup', async ({set, body}) => {
    const {email, err} = check(body, ['email', 'password']);
    if (err) return error(set, 400, err);

    const isTaken = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
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

    const isTaken = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (isTaken.length) return error(set, 409, 'This email is already taken');

    const newPassword = await createHash(password);
    await attempt(sql`INSERT INTO users (email, username, password) VALUES (${email}, ${username}, ${newPassword})`);

    const apiKey = getAPIKey();
    await attempt(sql`UPDATE users SET api_key = ${apiKey} WHERE email = ${email}`);

    if (secret && recovery.length) {
      await attempt(sql`UPDATE users SET totp = ${secret} WHERE email = ${email}`);
      await attempt(sql`UPDATE users SET recovery = ${recovery} WHERE email = ${email}`);
    }

    const id = generateID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);
    await request('/billing/customer', 'POST', {email, payment});

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  });
