import {attemptQuery, comparePassword, hashAndSaltPassword, msg} from '../utils';
import {BodyField, QueryResult, User} from '../types';
import {check, checkError} from '../checks';
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
  .get('/', async ({user}) => user)
  .post('/signup', async ({jwt, body, user}) => {
    if (user) return msg('You are already logged in', 'info');

    const {password, username, err} = check(body as BodyField, ['password', 'username']);
    if (err) return msg(err, 'alert');

    const newPassword = await hashAndSaltPassword(password);
    const result = await attemptQuery(sql`INSERT INTO users (username, password) VALUES (${username}, ${newPassword})`);
    if (result instanceof Error) return checkError(result, 'Username');

    const cookieValue = await jwt.sign({password, username});
    return {cookie: cookieValue};
  })
  .post('/otp', async ({user}) => {
    if (!user) return msg('You are not logged in', 'info');

    const secret = new OTPAuth.Secret({size: 20}).base32;
    await attemptQuery(sql`UPDATE users SET otp_auth = ${secret} WHERE username = ${user.username}`);

    const totp = new OTPAuth.TOTP({
      issuer: 'ShadowSelf',
      label: user.username,
      algorithm: 'SHA512',
      digits: 6,
      period: 30,
      secret,
    });

    return {uri: totp.toString(), secret};
  })
  .post('otp-check', async ({body, user}) => {
    if (!user) return msg('You are not logged in', 'info');

    const {code, err} = check(body as BodyField, ['code'], true);
    if (err) return msg(err, 'alert');

    const result = (await attemptQuery(sql`SELECT otp_auth FROM users WHERE username = ${user.username}`)) as QueryResult[];
    const secret = result[0].otp_auth;

    const totp = new OTPAuth.TOTP({
      issuer: 'ShadowSelf',
      label: user.username,
      algorithm: 'SHA512',
      digits: 6,
      period: 30,
      secret,
    });

    if (totp.generate() === code) {
      return msg('Successfully logged in', 'success');
    } else {
      return msg('Invalid validation code. Please try again', 'alert');
    }
  })
  .post('/login', async ({jwt, body, user}) => {
    if (user) return msg('You are already logged in', 'info');

    const {password, username, err} = check(body as BodyField, ['password', 'username'], true);
    if (err) return msg(err, 'alert');

    const result = (await attemptQuery(sql`SELECT * FROM users WHERE username = ${username}`)) as QueryResult[];
    if (result.length === 0) return msg('Invalid credentials. Please try again', 'alert');

    const hashedPassword = result[0].password;
    const isPasswordCorrect = await comparePassword(password, hashedPassword);
    if (!isPasswordCorrect) return msg('Invalid credentials. Please try again', 'alert');

    const cookieValue = await jwt.sign({password, username});
    return {cookie: cookieValue};
  });
