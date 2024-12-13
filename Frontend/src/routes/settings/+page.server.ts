import type {PageServerLoad, Actions} from './$types';
import {fetchApi, createCookie} from '$lib';
import {redirect} from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  const response = await fetchApi('/settings', 'GET');
  return {settings: response};
};

export const actions: Actions = {
  username: async ({request, cookies}) => {
    const form = await request.formData();
    const username = form.get('username');
    const response = await fetchApi('/settings/username', 'PUT', {username});

    if (response.type === 'alert') return response;

    createCookie(cookies, 'token', response.cookie);
    return {message: 'Successfully changed username', type: 'success'};
  },
  password: async ({request, cookies}) => {
    const form = await request.formData();
    const password = form.get('password');
    const response = await fetchApi('/settings/password', 'PUT', {password});

    if (response.type === 'alert') return response;

    createCookie(cookies, 'token', response.cookie);
    return {message: 'Successfully changed password', type: 'success'};
  },
  otp: async ({request}) => {},
  recovery: async ({request}) => {},
  toggleApi: async ({request}) => await fetchApi('/settings/toggleAPI'),
  api: async ({request}) => await fetchApi('/settings/api-key'),
  billing: async ({request}) => {},
  deleteBilling: async ({request}) => {},
  session: async ({request, cookies}) => {
    const form = await request.formData();
    if (form.has('revoke')) await fetchApi('/settings/revoke', 'GET');

    cookies.delete('token', {path: '/'});
    redirect(302, '/');
  },
  delete: async ({cookies}) => {
    await fetchApi('/settings/full', 'DELETE');
    cookies.delete('token', {path: '/'});
    redirect(302, '/');
  },
};
