import type {QueryUser, User} from '@type';
import {sql} from '@core/services';

type SessionJwt = {
  verify: (token?: string) => Promise<unknown>;
};

export function getBearerToken(auth: string | undefined) {
  return auth && auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;
}

export async function verifySessionToken(token: string | undefined, jwt: SessionJwt): Promise<User> {
  if (!token) return undefined;

  try {
    const user = (await jwt.verify(token)) as User;
    if (!user?.email || !user.id) return undefined;

    const account = (await sql`SELECT sessions FROM users WHERE email = ${user.email}`) as QueryUser[];
    if (!account[0]?.sessions?.includes(user.id)) return undefined;

    return user;
  } catch (_) {
    return undefined;
  }
}
