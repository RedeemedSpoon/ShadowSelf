import {comparePWD, hashPWD, createTOTP, getSecret, getRecovery} from '../crypto';
import {BodyField, QueryResult, User} from '../types';
import {msg, attemptQuery} from '../utils';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {check} from '../checks';
import {Elysia} from 'elysia';

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
    const mustLog = ['/delete-otp', '/delete-full'];

    if (notLog.some((p) => relativePath === p) && user) {
      return msg('You are already logged in', 'info');
    }

    if (mustLog.some((p) => relativePath === p) && !user) {
      return msg('You are not logged in', 'info');
    }
  })
  .get('/', async ({user}) => user)
  .post('/login', async ({jwt, body}) => {
    const {password, username, err} = check(body as BodyField, ['password', 'username'], true);
    if (err) return msg(err, 'alert');

    const result = (await attemptQuery(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (result.length === 0) return msg('Invalid credentials. Please try again', 'alert');

    const hashedPassword = result[0].password;
    const isPasswordCorrect = await comparePWD(password, hashedPassword);
    if (!isPasswordCorrect) return msg('Invalid credentials. Please try again', 'alert');

    const has2fa = result[0].totp;
    if (has2fa) return {username};

    const cookieValue = await jwt.sign({password, username});
    return {cookie: cookieValue};
  })
  .post('/login-otp', async ({body, jwt}) => {
    const {token, username, password, err} = check(body as BodyField, ['token', 'username', 'password']);
    if (err) return msg(err, 'alert');

    const secret = (await attemptQuery(sql`SELECT totp FROM users WHERE username = ${username}`)) as QueryResult[];
    const totp = createTOTP(secret[0].totp, username);

    const isValid = totp.generate() === token;
    if (!isValid) return msg('Incorrect validation token. Please try again', 'alert');

    const cookieValue = await jwt.sign({username, password});
    return {cookie: cookieValue};
  })
  .post('/login-recovery', async ({body, jwt}) => {
    const {code, username, password, err} = check(body as BodyField, ['code', 'username', 'password']);
    if (err) return msg(err, 'alert');

    const result = (await attemptQuery(sql`SELECT recovery FROM users WHERE username = ${username}`)) as QueryResult[];
    const isValid = result[0].recovery.some((b) => b === code);
    if (!isValid) return msg('Incorrect recovery code. Try another one', 'alert');

    const cookieValue = await jwt.sign({username, password});
    return {cookie: cookieValue};
  })
  .post('/signup', async ({body}) => {
    const {username, err} = check(body as BodyField, ['username', 'password']);
    if (err) return msg(err, 'alert');

    const result = (await attemptQuery(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (result.length) return msg('This username is already taken', 'alert');

    return {username};
  })
  .post('/signup-otp', async () => {
    const secret = getSecret();
    const totp = createTOTP(secret, 'temporarily');
    const uri = totp.toString();
    return {uri, secret};
  })
  .post('/signup-recovery', async ({body}) => {
    const {token, secret, err} = check(body as BodyField, ['secret', 'token']);
    if (err) return msg(err, 'alert');

    const totp = createTOTP(secret, 'temporarily');
    const isValid = totp.generate() === token;
    if (!isValid) return msg('Incorrect validation token. Please try again', 'alert');

    const recovery = getRecovery();
    return {recovery};
  })
  .post('/signup-create', async ({jwt, body}) => {
    const fields = ['username', 'password', '?secret', '?recovery'];
    const {password, username, secret, recovery, err} = check(body as BodyField, fields);
    if (err) return msg(err, 'alert');

    const isTaken = (await attemptQuery(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (isTaken.length) return msg('This username is already taken', 'alert');

    const newPassword = await hashPWD(password);
    await attemptQuery(sql`INSERT INTO users (username, password) VALUES (${username}, ${newPassword})`);

    if (secret && recovery) {
      await attemptQuery(sql`UPDATE users SET totp = ${secret} WHERE username = ${username}`);
      await attemptQuery(sql`UPDATE users SET recovery = ${recovery} WHERE username = ${username}`);
    }

    const cookieValue = await jwt.sign({password, username});
    return {cookie: cookieValue};
  })
  .delete('/delete-full', async ({user}) => {
    const client = attemptQuery(sql`DELETE FROM users WHERE username = ${user!.username}`);
    if (!client) return msg('Something went wrong', 'alert');

    return client;
  })
  .delete('/delete-otp', async ({user}) => {
    const client = await attemptQuery(sql`UPDATE users SET totp = NULL, recovery = NULL WHERE username = ${user!.username}`);
    if (!client) return msg('Something went wrong', 'alert');

    return client;
  });
