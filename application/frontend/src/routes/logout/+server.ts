import {error, redirect} from '@sveltejs/kit';
import {fetchBackend} from '$utils/webfetch';
import type {RequestHandler} from './$types';

export const POST: RequestHandler = async ({cookies}) => {
  const token = cookies.get('token');
  if (token) {
    const response = await fetchBackend('/settings/logout', 'POST', {}, token);
    if (response.type === 'alert') error(503, 'Could not revoke this session. Please retry.');
  }

  cookies.delete('token', {path: '/'});
  redirect(303, '/');
};
