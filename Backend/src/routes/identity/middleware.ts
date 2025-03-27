import {Elysia, error} from 'elysia';
import {sql} from '@utils/connection';
import {attempt} from '@utils/utils';
import middleware from '@middleware';

export default (app: Elysia) =>
  app.use(middleware).derive(async ({user, params}) => {
    const identityID = (params as {id: string}).id;
    const result = await attempt(sql`SELECT * FROM users WHERE email = ${user!.email}`);
    const identity = await attempt(sql`SELECT * FROM identities WHERE id = ${identityID} AND owner = ${result[0].id}`);
    if (!identity.length) return error(400, 'Identity not found');

    return {identity: identity[0]};
  });
