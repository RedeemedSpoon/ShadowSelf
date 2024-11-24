import {comparePWD, hashPWD, createTOTP, getSecret, getBackupCodes} from '../crypto';
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
    const notLog = ['/login', '/login-otp', '/login-backup', '/signup', '/signup-otp', '/signup-backup', '/signup-create'];
    const mustLog = ['/settings', '/otp', '/full'];

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

    const has2fa = result[0].otp_auth;
    if (has2fa) return {username};

    const cookieValue = await jwt.sign({password, username});
    return {cookie: cookieValue};
  })
  .post('/login-otp', async ({body, jwt}) => {
    const {code, username, password, err} = check(body as BodyField, ['code', 'username', 'password']);
    if (err) return msg(err, 'alert');

    const secret = (await attemptQuery(sql`SELECT otp_auth FROM users WHERE username = ${username}`)) as QueryResult[];
    const totp = createTOTP(secret[0].otp_auth, username);
    const isValid = totp.generate() === code;

    if (!isValid) return msg('Incorrect validation code. Please try again', 'alert');

    const cookieValue = await jwt.sign({username, password});
    return {cookie: cookieValue};
  })
  .post('/login-backup', async ({body, jwt}) => {
    const {backup, username, password, err} = check(body as BodyField, ['backup', 'username', 'password']);
    if (err) return msg(err, 'alert');

    const allBackups = (await attemptQuery(sql`SELECT backup_codes FROM users WHERE username = ${username}`)) as QueryResult[];
    const isValid = allBackups[0].backup_codes.some((b) => b === backup);

    if (!isValid) return msg('Incorrect backup code. Try another one', 'alert');

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
  .post('/signup-otp', async ({user}) => {
    const secret = getSecret();
    const totp = createTOTP(secret, user!.username);
    const uri = totp.toString();
    return {uri, secret};
  })
  .post('/signup-backup', async ({body, user}) => {
    const {code, secret, err} = check(body as BodyField, ['secret', 'code']);
    if (err) return msg(err, 'alert');

    const totp = createTOTP(secret, user!.username);
    const isValid = totp.generate() === code;

    if (!isValid) return msg('Incorrect validation code. Please try again', 'alert');

    const backupCodes = getBackupCodes();
    return {backup: backupCodes};
  })
  .post('/signup-create', async ({jwt, body}) => {
    const fields = ['username', 'password', '?secret', '?backups'];
    const {password, username, secret, backups, err} = check(body as BodyField, fields);
    if (err) return msg(err, 'alert');

    const isTaken = (await attemptQuery(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (isTaken.length) return msg('This username is already taken', 'alert');

    const newPassword = await hashPWD(password);
    await attemptQuery(sql`INSERT INTO users (username, password) VALUES (${username}, ${newPassword})`);

    if (secret && backups) {
      await attemptQuery(sql`UPDATE users SET otp_auth = ${secret} WHERE username = ${username}`);
      await attemptQuery(sql`UPDATE users SET backup_codes = ${backups} WHERE username = ${username}`);
    }

    const cookieValue = await jwt.sign({password, username});
    return {cookie: cookieValue};
  })
  .delete('/full', async ({user}) => {
    const costumer = attemptQuery(sql`DELETE FROM users WHERE username = ${user!.username}`);
    if (!user) return msg('Something went wrong', 'alert');

    return costumer;
  })
  .delete('/otp', async ({user}) => {
    const customer = (await attemptQuery(
      sql`UPDATE users SET otp_auth = NULL, backup_codes = NULL WHERE username = ${user!.username}`,
    )) as QueryResult[];
    if (!customer) return msg('Something went wrong', 'alert');

    return customer;
  });
