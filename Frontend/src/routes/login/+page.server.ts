import {createCookie, fetchBackend} from '$lib';
import {redirect} from '@sveltejs/kit';
import type {Actions} from './$types';

export const actions: Actions = {
  checkCredentials: async ({request, cookies}) => {
    const form = await request.formData();
    const password = form.get('password');
    const email = form.get('email');

    const response = await fetchBackend('/account/login', 'POST', {email, password});
    if (!response.email && !response.cookie) return response;

    if (response.cookie) {
      if (cookies.get('login')) cookies.delete('login', {path: '/'});
      createCookie(cookies, 'token', response.cookie);
      redirect(302, '/dashboard');
    }

    createCookie(cookies, 'login', `${email}`);
    return {step: 4};
  },
  checkEmail: async ({request, cookies}) => {
    const form = await request.formData();
    const email = form.get('email');

    const response = await fetchBackend('/account/login-email', 'POST', {email});
    if (!response.email) return response;

    createCookie(cookies, 'login', `${email}`);
    return {step: 3};
  },
  checkAccess: async ({request, cookies}) => {
    const form = await request.formData();
    const access = form.get('access');
    const email = cookies.get('login');

    const response = await fetchBackend('/account/login-access', 'POST', {email, access});
    if (!response.email && !response.cookie) return response;

    if (response.cookie) {
      cookies.delete('login', {path: '/'});
      createCookie(cookies, 'token', response.cookie);
      redirect(302, '/dashboard');
    }

    return {step: 4};
  },
  checkOTP: async ({request, cookies}) => {
    const form = await request.formData();
    const token = form.get('token');
    const email = cookies.get('login');

    const response = await fetchBackend('/account/login-otp', 'POST', {token, email});
    if (!response.cookie) return response;

    cookies.delete('login', {path: '/'});
    createCookie(cookies, 'token', response.cookie);
    redirect(302, '/dashboard');
  },
  checkRecovery: async ({request, cookies}) => {
    const form = await request.formData();
    const code = form.get('code');
    const email = cookies.get('login');

    const response = await fetchBackend('/account/login-recovery', 'POST', {code, email});
    if (!response.cookie) return response;

    cookies.delete('login', {path: '/'});
    createCookie(cookies, 'token', response.cookie);
    redirect(302, '/dashboard');
  },
};
