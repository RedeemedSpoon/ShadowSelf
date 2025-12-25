import {attempt} from '@utils/utils';
import {sql} from '@utils/connection';
import {jwt} from '@elysiajs/jwt';
import {Elysia} from 'elysia';

const error = (set: {[key: string]: unknown}, status: number, message: string) => {
  set.status = status;
  throw new Response(message, {
    headers: {'Content-Type': 'text/plain'},
    status: status,
  });
};

export default (app: Elysia) =>
  app.use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string,  exp : "90d"}))
  .derive(async ({headers, jwt, params, path, cookie, set}) => {
    const auth = headers['authorization'];
    const token = auth && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : cookie['token']?.value as string;

    if (!token) return error(set, 401, 'You are not authenticated correctly');
    let user;

    if (token.length === 32) {
      const apiKey = await attempt(sql`SELECT email, api_key, api_access FROM users WHERE api_key = ${token}`);
      if (!apiKey.length) return error(set, 401, 'You are not authenticated correctly');
      if (!apiKey[0].api_access) return error(set, 401, 'You disabled API access');
      user = {email: apiKey[0].email};
    }

    if (!user) user = await jwt.verify(token) as {email: string};
    if (!user) return error(set, 401, 'You are not authenticated correctly');

    const excludedPaths = /(?:\/api\/proxy|\/api)\/?$|\/api\/test$/;
    if (excludedPaths.test(path)) return {user};

    const identityID = (params as {id: string}).id;
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user.email}`);

    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${identityID} AND owner = ${result[0].id}`);
    if (!identity.length) return error(set, 400, 'Identity not found');

    return {identity: identity[0]};
  });
