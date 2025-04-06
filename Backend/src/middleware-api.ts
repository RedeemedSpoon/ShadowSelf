import {sql} from '@utils/connection';
import {Elysia, error} from 'elysia';
import {attempt} from '@utils/utils';
import {jwt} from '@elysiajs/jwt';

export default (app: Elysia) =>
  app.use(jwt({name: 'jwt', secret: process.env.JWT_SECRET as string})).derive(async ({headers, jwt, params, path, cookie}) => {
    const auth = headers['authorization'];
    let token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;

    token = token || cookie['token'].value;
    if (!token) return error(401, 'You are not authenticated correctly');

    let user;

    if (token.length === 32) {
      const apiKey = await attempt(sql`SELECT email, api_key, api_access FROM users WHERE api_key = ${token}`);
      if (apiKey.length === 0) return error(401, 'You are not authenticated correctly');
      if (!apiKey[0].api_access) return error(401, 'You disabled API access');
      user = {email: apiKey[0].email};
    }

    if (!user) user = await jwt.verify(token);
    if (!user) return error(401, 'You are not authenticated correctly');

    if (path.slice(-4) === '/api' || path.slice(-9) === '/api/test') return {user};

    const identityID = (params as {id: string}).id;
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user.email}`);

    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${identityID} AND owner = ${result[0].id}`);
    if (!identity.length) return error(400, 'Identity not found');

    return {identity: identity[0]};
  });
