import {mailAdminConfig} from '@core/config';
import {randomBytes} from 'crypto';

type MailboxLookup = {
  exists?: boolean;
};

export function generateMailboxPassword() {
  return randomBytes(24).toString('base64url');
}

export async function mailboxExists(username: string) {
  const response = await mailAdminRequest('GET', mailboxPath(username), undefined, [404]);
  if (response.status === 404) return false;

  const data = (await response.json().catch(() => ({}))) as MailboxLookup;
  return typeof data.exists === 'boolean' ? data.exists : true;
}

export async function createMailboxUser(username: string, password: string) {
  try {
    await mailAdminRequest('POST', '/mailboxes', {username, password});
  } catch (err) {
    throw new Error('mailbox', {cause: err});
  }
}

export async function deleteMailboxUser(username: string) {
  if (!username) return;
  await mailAdminRequest('DELETE', mailboxPath(username), undefined, [404]);
}

async function mailAdminRequest(method: string, path: string, body?: object, allowedStatuses: number[] = []) {
  const url = getMailAdminUrl(path);
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${mailAdminConfig.token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.ok || allowedStatuses.includes(response.status)) return response;
  throw new Error('mail-admin-request');
}

function getMailAdminUrl(path: string) {
  const baseUrl = mailAdminConfig.url.replace(/\/+$/, '');
  if (!baseUrl || !mailAdminConfig.token) throw new Error('mail-admin-config');
  return `${baseUrl}${path}`;
}

function mailboxPath(username: string) {
  return `/mailboxes/${encodeURIComponent(username)}`;
}
