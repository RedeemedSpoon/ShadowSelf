import {comparePWD, hashPWD, createTOTP, getSecret, getRecovery} from '../crypto';
import {QueryResult, User} from '../types';
import {Elysia, error} from 'elysia';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';
import {check} from '../checks';

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
    const notLog = ['/login', '/login-otp', '/login-recovery', '/signup', '/signup-otp', '/signup-recovery', '/signup-create'];

    if (notLog.some((p) => relativePath === p) && user) {
      return error(401, 'You are already logged in');
    }
  })
  .get('/', async ({user}) => {
    if (!user) return;

    const response = (await attempt(sql`SELECT revoke_session FROM users WHERE username = ${user!.username}`)) as QueryResult[];
    if (response[0].revoke_session) return {logout: true};

    return user?.username;
  })
  .post('/login', async ({jwt, body}) => {
    const {password, username, err} = check(body, ['password', 'username'], true);
    if (err) return error(400, err);

    const result = (await attempt(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (!result.length) return error(400, 'Invalid credentials. Please try again');

    const hashedPassword = result[0].password;
    const isPasswordCorrect = await comparePWD(password, hashedPassword);
    if (!isPasswordCorrect) return error(400, 'Invalid credentials. Please try again');

    const has2fa = result[0].totp;
    if (has2fa) return {username};

    await attempt(sql`UPDATE users SET revoke_session = false WHERE username = ${username}`);
    const cookieValue = await jwt.sign({password, username});
    return {cookie: cookieValue};
  })
  .post('/login-otp', async ({body, jwt}) => {
    const {token, username, password, err} = check(body, ['token', 'username', 'password'], true);
    if (err) return error(400, err);

    const secret = (await attempt(sql`SELECT totp FROM users WHERE username = ${username}`)) as QueryResult[];
    if (!secret.length) return error(400, 'Incorrect validation token. Please try again');

    const totp = createTOTP(secret[0].totp, username);
    const isValid = totp.generate() === token;
    if (!isValid) return error(400, 'Incorrect validation token. Please try again');

    await attempt(sql`UPDATE users SET revoke_session = false WHERE username = ${username}`);
    const cookieValue = await jwt.sign({username, password});
    return {cookie: cookieValue};
  })
  .post('/login-recovery', async ({body, jwt}) => {
    const {code, username, password, err} = check(body, ['code', 'username', 'password'], true);
    if (err) return error(400, err);

    const recovery = (await attempt(sql`SELECT recovery FROM users WHERE username = ${username}`)) as QueryResult[];
    if (!recovery.length) return error(400, 'Incorrect recovery code. Try another one');

    const allCodes = recovery[0].recovery;
    if (!allCodes.length) return error(400, 'Incorrect recovery code. Try another one');

    const isValid = allCodes.includes(code);
    if (!isValid) return error(400, 'Incorrect recovery code. Try another one');

    const newCodes = allCodes.filter((c) => c !== code);
    await attempt(sql`UPDATE users SET recovery = ${newCodes} WHERE username = ${username}`);

    await attempt(sql`UPDATE users SET revoke_session = false WHERE username = ${username}`);
    const cookieValue = await jwt.sign({username, password});
    return {cookie: cookieValue};
  })
  .post('/signup', async ({body}) => {
    const {username, err} = check(body, ['username', 'password']);
    if (err) return error(400, err);

    const result = (await attempt(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (result.length) return error(409, 'This username is already taken');

    return {username};
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
    const fields = ['username', 'password', '?secret', '?recovery'];
    const {password, username, secret, recovery, err} = check(body, fields);
    if (err) return error(400, err);

    const isTaken = (await attempt(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (isTaken.length) return error(409, 'This username is already taken');

    const newPassword = await hashPWD(password);
    await attempt(sql`INSERT INTO users (username, password) VALUES (${username}, ${newPassword})`);

    if (secret && recovery) {
      await attempt(sql`UPDATE users SET totp = ${secret} WHERE username = ${username}`);
      await attempt(sql`UPDATE users SET recovery = ${recovery} WHERE username = ${username}`);
    }

    const cookieValue = await jwt.sign({password, username});
    return {cookie: cookieValue};
  });
