import {origin, onionOrigin} from '@core/config';
import {ApiError, sessionToken, tokenHash} from '@core/security';
import {sql} from '@core/services';
import type {QueryUser, User} from '@type';
import type {TransactionSql} from 'postgres';

export function getBearerToken(authorization: string | undefined) {
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);

  return match?.[1];
}

export async function issueSession(
  account: string | Pick<QueryUser, 'email' | 'password' | 'totp'>,
  transaction?: TransactionSql,
) {
  const create = async (connection: TransactionSql) => {
    const email = typeof account === 'string' ? account : account.email;
    const users = await connection`SELECT id, password, totp FROM users WHERE email = ${email} FOR SHARE`;

    const current = users[0];

    if (
      !current ||
      (typeof account !== 'string' && (current.password !== account.password || current.totp !== account.totp))
    ) {
      throw new ApiError(401, 'unauthenticated', 'Account changed. Sign in again');
    }

    const token = sessionToken();
    await connection`INSERT INTO sessions (owner, token_hash, expires_at)
      VALUES (${current.id}, ${tokenHash(token)}, NOW() + INTERVAL '90 days')`;

    return token;
  };

  return transaction ? create(transaction) : sql.begin(create);
}

export async function verifySessionToken(token: string | undefined): Promise<User> {
  if (!token?.startsWith('ss_session_')) {
    return undefined;
  }

  const rows = await sql`SELECT u.email, u.id AS account_id, s.id FROM sessions s JOIN users u ON u.id = s.owner
    WHERE s.token_hash = ${tokenHash(token)} AND s.expires_at > NOW()`;

  return rows[0] ? {email: rows[0].email, id: rows[0].id, accountID: rows[0].account_id} : undefined;
}

export async function verifyApiToken(token: string | undefined): Promise<User> {
  if (!token?.startsWith('ss_api_')) {
    return undefined;
  }

  const rows = await sql`SELECT id, email FROM users WHERE api_key = ${tokenHash(token)} AND api_access = true`;

  return rows[0] ? {email: rows[0].email, id: '', accountID: rows[0].id} : undefined;
}

export function trustedCookieRequest(request: Request) {
  const safe =
    ['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
    request.headers.get('upgrade')?.toLowerCase() !== 'websocket';

  if (safe || getBearerToken(request.headers.get('authorization') || undefined)) {
    return true;
  }

  return [origin, onionOrigin].filter(Boolean).includes(request.headers.get('origin') || '');
}
