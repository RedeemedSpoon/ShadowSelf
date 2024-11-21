import {msg, attemptQuery, comparePassword, hashAndSaltPassword, generateBackupCodes} from '../utils';
import {BodyField, QueryResult, User} from '../types';
import {check} from '../checks';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import * as OTPAuth from 'otpauth';
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
    const notLog = ['/login', '/login-otp', '/login-backup', '/signup', '/dry-run', '/dry-run-otp', '/dry-run-backup'];
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
    const isPasswordCorrect = await comparePassword(password, hashedPassword);
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
    const totp = new OTPAuth.TOTP({
      label: username,
      issuer: 'ShadowSelf',
      algorithm: 'SHA512',
      digits: 6,
      period: 30,
      secret: secret[0].otp_auth,
    });

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
  .post('/signup-first-step', async ({body}) => {
    const {username, err} = check(body as BodyField, ['password', 'username']);
    if (err) return msg(err, 'alert');

    const result = (await attemptQuery(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (result.length) return msg('This username is already taken', 'alert');

    return {username};
  })
  .post('/signup-second-step', async ({user}) => {
    const secret = new OTPAuth.Secret({size: 20}).base32;
    const totp = new OTPAuth.TOTP({
      issuer: 'ShadowSelf',
      label: user?.username,
      algorithm: 'SHA512',
      digits: 6,
      period: 30,
      secret,
    });

    const uri = totp.toString();
    return {uri, secret};
  })
  .post('/signup-third-step', async ({body, user}) => {
    const {code, secret, err} = check(body as BodyField, ['code', 'secret']);
    if (err) return msg(err, 'alert');

    const totp = new OTPAuth.TOTP({
      issuer: 'ShadowSelf',
      label: user?.username,
      algorithm: 'SHA512',
      digits: 6,
      period: 30,
      secret,
    });

    const isValid = totp.generate() === code;
    if (!isValid) return msg('Incorrect validation code. Please try again', 'alert');

    const backupCodes = generateBackupCodes();
    return {backup: backupCodes};
  })
  .post('/signup-final-step', async ({jwt, body}) => {
    const fields = ['password', 'username', 'secret', 'backups'];
    const {password, username, secret, backup, err} = check(body as BodyField, fields);
    if (err) return msg(err, 'alert');

    const isTaken = (await attemptQuery(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (isTaken.length) return msg('This username is already taken', 'alert');

    const newPassword = await hashAndSaltPassword(password);
    await attemptQuery(sql`INSERT INTO users (username, password) VALUES (${username}, ${newPassword})`);

    if (secret && backup) {
      await attemptQuery(sql`UPDATE users SET otp_auth = ${secret} WHERE username = ${username}`);
      await attemptQuery(sql`UPDATE users SET backup_codes = ${backup} WHERE username = ${username}`);
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
