import type {QueryUser, SessionJwt, User} from '@type';
import {sql} from '@core/services';

export function getBearerToken(authorization: string | undefined) {
  return authorization?.toLowerCase().startsWith('bearer ') ? authorization.slice(7) : undefined;
}

export async function verifySessionToken(token: string | undefined, jwt: SessionJwt): Promise<User> {
  if (!token) return undefined;

  try {
    const claims = await jwt.verify(token);
    if (!claims || typeof claims !== 'object' || !('email' in claims) || !('id' in claims)) return undefined;
    const {email, id} = claims;
    if (typeof email !== 'string' || typeof id !== 'string' || !email || !id) return undefined;

    const accounts = (await sql`SELECT sessions FROM users WHERE email = ${email}`) as QueryUser[];
    if (!accounts[0]?.sessions?.includes(id)) return undefined;

    return {email, id};
  } catch {
    return undefined;
  }
}
