import {origin} from '@core/config';
import type {QueryUser, SessionJwt, User} from '@type';
import {sql} from '@core/services';

export function getBearerToken(authorization: string | undefined) {
  return authorization?.toLowerCase().startsWith('bearer ') ? authorization.slice(7) : undefined;
}

export async function verifySessionToken(token: string | undefined, jwt: SessionJwt): Promise<User> {
  if (!token) return undefined;

  try {
    const claims = await jwt.verify(token);
    if (!claims || typeof claims !== 'object' || !('email' in claims) || !('id' in claims) || !('exp' in claims)) return undefined;

    const {email, id, exp} = claims;
    if (typeof exp !== 'number' || !Number.isFinite(exp) || exp <= Date.now() / 1000) return undefined;
    if (typeof email !== 'string' || typeof id !== 'string' || !email || !id) return undefined;

    const accounts = (await sql`SELECT sessions FROM users WHERE email = ${email}`) as QueryUser[];
    if (!accounts[0]?.sessions?.includes(id)) return undefined;

    return {email, id};
  } catch {
    return undefined;
  }
}

export function trustedCookieRequest(request: Request) {
  const safe = ['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.get('upgrade')?.toLowerCase() !== 'websocket';
  if (safe || getBearerToken(request.headers.get('authorization') || undefined)) return true;

  const allowed = [origin, 'http://shadow7sk64geknoyyzsfyjm4rylnknx5pzhfhzkecoggowhitafggqd.onion'];
  return allowed.includes(request.headers.get('origin') || '');
}
