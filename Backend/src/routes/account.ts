import {compareHash, createHash, genereteID, createTOTP, getAPIKey, getSecret, getRecovery} from '../crypto';
import {attempt, verifyEmail} from '../utils';
import {Elysia, error} from 'elysia';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {check} from '../checks';
import {User} from '../types';

export default new Elysia({prefix: '/account'})
  .use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string}))
  .derive(async ({headers, jwt}) => {
    const auth = headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const user = (await jwt.verify(token)) as User;
    return {user};
  })
  .onBeforeHandle(({user, path}) => {
    const relativePath = path.slice(8);
    const signUp = ['/signup', 'signup-email', '/signup-username', '/signup-otp', '/signup-recovery', '/signup-create'];
    const logIn = ['/login', '/login-email', '/login-otp', '/login-recovery'];
    const mustNotLogIn = [...signUp, ...logIn];

    if (mustNotLogIn.some((p) => relativePath === p) && user) {
      return error(401, 'You are already logged in');
    }
  })
  .get('/', async ({user}) => {
    if (!user) return;

    const result = await attempt(sql`SELECT revoke_session, username FROM users WHERE email = ${user.email}`);
    if (!result[0].revoke_session.includes(user.id)) return error(401, 'Not authorized');

    return result[0].username;
  })
  .get('/recovery-remaining', async ({user}) => {
    if (!user) return;

    const result = await attempt(sql`SELECT recovery FROM users WHERE email = ${user.email}`);
    return result[0]?.recovery.length;
  })
  .post('/login', async ({jwt, body}) => {
    const {password, email, err} = check(body, ['password', 'email'], true);
    if (err) return error(400, err);

    const result = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (!result.length) return error(400, 'Invalid credentials. Please try again');

    const hashedPassword = result[0].password;
    const isPasswordCorrect = await compareHash(password, hashedPassword);
    if (!isPasswordCorrect) return error(400, 'Invalid credentials. Please try again');

    const has2fa = result[0].totp;
    if (has2fa) return {email};

    const id = genereteID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  })
  .post('/login-email', async ({body, jwt}) => {
    const {email, err} = check(body, ['email']);
    if (err) return error(400, err);

    const result = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (!result.length) return error(400, 'Email address is not registered on our systems');

    //@ts-expect-error JWT only accept objects
    const accessToken = await jwt.sign(email + process.env.JWT_SECRET);
    const response = await verifyEmail(email, accessToken.split('.')[2]);
    if (response.err) return error(500, 'Failed to send verification email. Try later');

    return {email};
  })
  .post('/login-access', async ({body, jwt}) => {
    const {email, access, err} = check(body, ['email', 'access']);
    if (err) return error(400, err);

    const result = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (!result.length) return error(400, 'Email address is not registered on our systems');

    //@ts-expect-error JWT only accept objects
    const accessToken = await jwt.sign(email + process.env.JWT_SECRET);
    if (access !== accessToken.split('.')[2]) return error(400, 'Invalid access token. Please Try again');

    const has2fa = result[0].totp;
    if (has2fa) return {email};

    const id = genereteID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);

    const cookievalue = await jwt.sign({email, id});
    return {cookie: cookievalue};
  })
  .post('/login-otp', async ({body, jwt}) => {
    const {token, email, err} = check(body, ['token', 'email'], true);
    if (err) return error(400, err);

    const secret = await attempt(sql`SELECT totp FROM users WHERE email = ${email}`);
    if (!secret.length) return error(400, 'Incorrect validation token. Please try again');

    const totp = createTOTP(secret[0].totp, 'temporarily');
    const isValid = totp.generate() === token;
    if (!isValid) return error(400, 'Incorrect validation token. Please try again');

    const id = genereteID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  })
  .post('/login-recovery', async ({body, jwt}) => {
    const {code, email, err} = check(body, ['code', 'email'], true);
    if (err) return error(400, err);

    const recovery = await attempt(sql`SELECT recovery FROM users WHERE email = ${email}`);
    if (!recovery.length) return error(400, 'Incorrect recovery code. Try another one');

    const allCodes = recovery[0].recovery;
    if (!allCodes.length) return error(400, 'Incorrect recovery code. Try another one');

    const isValid = allCodes.includes(code);
    if (!isValid) return error(400, 'Incorrect recovery code. Try another one');

    const newCodes = allCodes.filter((c) => c !== code);
    await attempt(sql`UPDATE users SET recovery = ${newCodes} WHERE email = ${email}`);

    const id = genereteID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  })
  .post('/signup', async ({body, jwt}) => {
    const {email, err} = check(body, ['email', 'password']);
    if (err) return error(400, err);

    const isTaken = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (isTaken.length) return error(409, 'This email is already taken');

    //@ts-expect-error JWT only accept objects
    const accessToken = await jwt.sign(email + process.env.JWT_SECRET);
    const response = await verifyEmail(email, accessToken.split('.')[2]);
    if (response.err) return error(500, 'Failed to send verification email. Try later');

    return {email};
  })
  .post('/signup-email', async ({body, jwt}) => {
    const {email, access, err} = check(body, ['email', 'access']);
    if (err) return error(400, err);

    //@ts-expect-error JWT only accept objects
    const accessToken = await jwt.sign(email + process.env.JWT_SECRET);
    if (access !== accessToken.split('.')[2]) return error(400, 'Invalid access token. Please Try again');

    return {email};
  })
  .post('/signup-username', async ({body}) => {
    const {username, err} = check(body, ['username']);
    return err ? error(400, err) : {username};
  })
  .post('/signup-otp', async ({body}) => {
    const {username, err} = check(body, ['username'], true);
    if (err) return error(400, err);

    const secret = getSecret();
    const totp = createTOTP(secret, username);
    const uri = totp.toString();

    return {uri, secret};
  })
  .post('/signup-recovery', async ({body}) => {
    const {token, secret, err} = check(body, ['secret', 'token']);
    if (err) return error(400, err);

    const totp = createTOTP(secret, 'temporarily');
    const isValid = totp.generate() === token;
    if (!isValid) return error(400, 'Incorrect validation token. Please try again');

    const recovery = getRecovery();
    return {recovery};
  })
  .post('/signup-create', async ({jwt, body}) => {
    const fields = ['username', 'password', 'email', 'access', '?secret', '?recovery'];
    const {password, username, email, access, secret, recovery, err} = check(body, fields);
    if (err) return error(400, err);

    //@ts-expect-error JWT only accept objects
    const accessToken = await jwt.sign(email + process.env.JWT_SECRET);
    if (access !== accessToken.split('.')[2]) return error(400, 'Invalid access token');

    const isTaken = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (isTaken.length) return error(409, 'This email is already taken');

    const newPassword = await createHash(password);
    await attempt(sql`INSERT INTO users (email, username, password) VALUES (${email}, ${username}, ${newPassword})`);

    const apiKey = getAPIKey();
    await attempt(sql`UPDATE users SET api_key = ${apiKey} WHERE email = ${email}`);

    if (secret && recovery) {
      await attempt(sql`UPDATE users SET totp = ${secret} WHERE email = ${email}`);
      await attempt(sql`UPDATE users SET recovery = ${recovery} WHERE email = ${email}`);
    }

    const id = genereteID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  });
