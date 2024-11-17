import type {Actions} from './$types';
import {dev} from '$app/environment';
import {fetchApi} from '$lib';

export const actions: Actions = {
  signup: async ({request, cookies}) => {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');

    const response = await fetchApi('/account/signup', 'POST', {username, password});
    if (!response.cookie) return response;

    cookies.set('token', response.cookie, {
      path: '/',
      httpOnly: true,
      secure: true,
      domain: dev ? 'localhost' : 'shadowself.io',
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      priority: 'high',
    });
  },
};