import {comparePWD, hashPWD, genereteID, createTOTP, getAPIKey, getSecret, getRecovery} from '../crypto';
import {Elysia, error} from 'elysia';
import {sql} from '../connection';
import {jwt} from '@elysiajs/jwt';
import {attempt} from '../utils';
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
    const signUp = ['/signup', 'signup-email', '/signup-otp', '/signup-recovery', '/signup-create'];
    const logIn = ['/login', '/login-email', '/login-otp', '/login-recovery'];

    if ((signUp.some((p) => relativePath === p) || logIn.some((p) => relativePath === p)) && user) {
      return error(401, 'You are already logged in');
    }
  })
  .get('/', async ({user}) => {
    if (!user) return;

    const result = await attempt(sql`SELECT revoke_session FROM users WHERE email = ${user.email}`);
    if (!result[0].revoke_session.includes(user.id)) return error(401, 'Not authorized');

    return result[0].email;
  })
  .post('/login', async ({jwt, body}) => {
    const {password, email, err} = check(body, ['password', 'email'], true);
    if (err) return error(400, err);

    const result = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (!result.length) return error(400, 'Invalid credentials. Please try again');

    const hashedPassword = result[0].password;
    const isPasswordCorrect = await comparePWD(password, hashedPassword);
    if (!isPasswordCorrect) return error(400, 'Invalid credentials. Please try again');

    const has2fa = result[0].totp;
    if (has2fa) return {email};

    const id = genereteID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${email}`);

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  })
  .post('/login-email', async () => {})
  .post('/login-otp', async ({body, jwt}) => {
    const {token, email, username, err} = check(body, ['token', 'username', 'email'], true);
    if (err) return error(400, err);

    const secret = await attempt(sql`SELECT totp FROM users WHERE email = ${email}`);
    if (!secret.length) return error(400, 'Incorrect validation token. Please try again');

    const totp = createTOTP(secret[0].totp, username);
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
  .post('/signup', async ({body}) => {
    const {username, err} = check(body, ['username', 'password']);
    return err ? error(400, err) : {username};
  })
  .post('/signup-email', async () => {})
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
    const fields = ['username', 'password', 'email', '?secret', '?recovery'];
    const {password, username, email, secret, recovery, err} = check(body, fields);
    if (err) return error(400, err);

    const isTaken = await attempt(sql`SELECT * FROM users WHERE email = ${email}`);
    if (isTaken.length) return error(409, 'This email is already taken');

    const newPassword = await hashPWD(password);
    await attempt(sql`INSERT INTO users (username, password) VALUES (${username}, ${newPassword})`);

    const apiKey = getAPIKey();
    await attempt(sql`UPDATE users SET api_key = ${apiKey} WHERE email = ${username}`);

    if (secret && recovery) {
      await attempt(sql`UPDATE users SET totp = ${secret} WHERE email = ${username}`);
      await attempt(sql`UPDATE users SET recovery = ${recovery} WHERE email = ${username}`);
    }

    const id = genereteID();
    await attempt(sql`UPDATE users SET revoke_session = ARRAY_APPEND(revoke_session, ${id}) WHERE email = ${username}`);

    const cookieValue = await jwt.sign({email, id});
    return {cookie: cookieValue};
  });
