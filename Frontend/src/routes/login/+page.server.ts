import {createCookie, fetchApi} from '$lib';
import {redirect} from '@sveltejs/kit';
import type {Actions} from './$types';

export const actions: Actions = {
  checkCredentials: async ({request, cookies}) => {
    const form = await request.formData();
    const username = form.get('username');
    const password = form.get('password');

    const response = await fetchApi('/account/login', 'POST', {username, password});
    if (!response.username && !response.cookie) return response;

    if (response.cookie) {
      if (cookies.get('login')) cookies.delete('login', {path: '/'});
      createCookie(cookies, 'token', response.cookie);
      redirect(302, '/dashboard');
    }

    const concat = `${username}&&${password}`;
    createCookie(cookies, 'login', concat);
    return {step: 2};
  },
  checkOTP: async ({request, cookies}) => {
    const form = await request.formData();
    const token = form.get('token');
    const [username, password] = cookies.get('login')!.split('&&');

    const response = await fetchApi('/account/login-otp', 'POST', {token, username, password});
    if (!response.cookie) return response;

    cookies.delete('login', {path: '/'});
    createCookie(cookies, 'token', response.cookie);
    redirect(302, '/dashboard');
  },
  checkRecovery: async ({request, cookies}) => {
    const form = await request.formData();
    const code = form.get('code');
    const [username, password] = cookies.get('login')!.split('&&');

    const response = await fetchApi('/account/login-recovery', 'POST', {code, username, password});
    if (!response.cookie) return response;

    cookies.delete('login', {path: '/'});
    createCookie(cookies, 'token', response.cookie);
    redirect(302, '/dashboard');
  },
};
