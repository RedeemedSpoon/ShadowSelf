import {fetchBackend} from '$lib/backend.server';
import {createCookie} from '$utils/shared';
import {redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import type {Cookies} from '@sveltejs/kit';

function setLoginChallenge(cookies: Cookies, challenge: string, expiresIn: number) {
  cookies.set('login-challenge', challenge, {
    path: '/login',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: expiresIn,
  });
}

export const actions: Actions = {
  checkCredentials: async ({request, cookies}) => {
    cookies.delete('login-challenge', {path: '/login'});

    const form = await request.formData();

    const password = form.get('password');
    const email = form.get('email');

    const response = await fetchBackend('/auth/password', 'POST', {email, password}, cookies.get('token'));

    if (!response.challenge && !response.token) {
      return response;
    }

    if (response.token) {
      if (cookies.get('login')) {
        cookies.delete('login', {path: '/'});
      }

      createCookie(cookies, 'token', response.token);

      redirect(302, '/dashboard');
    }

    setLoginChallenge(cookies, response.challenge, response.expiresIn);

    return {step: 4};
  },
  checkEmail: async ({request, cookies}) => {
    cookies.delete('login-challenge', {path: '/login'});

    const form = await request.formData();

    const email = form.get('email');

    const response = await fetchBackend('/auth/email', 'POST', {email}, cookies.get('token'));

    if (!response.email) {
      return response;
    }

    createCookie(cookies, 'login', `${email}`);

    return {step: 3};
  },
  checkAccess: async ({request, cookies}) => {
    const form = await request.formData();

    const access = form.get('access');
    const email = cookies.get('login');

    const response = await fetchBackend('/auth/email/verify', 'POST', {email, access}, cookies.get('token'));

    if (!response.challenge && !response.token) {
      return response;
    }

    if (response.token) {
      cookies.delete('login', {path: '/'});
      createCookie(cookies, 'token', response.token);

      redirect(302, '/dashboard');
    }

    cookies.delete('login', {path: '/'});
    setLoginChallenge(cookies, response.challenge, response.expiresIn);

    return {step: 4};
  },
  checkOTP: async ({request, cookies}) => {
    const form = await request.formData();

    const token = form.get('token');
    const challenge = cookies.get('login-challenge');

    const response = await fetchBackend('/auth/second-factor', 'POST', {token, challenge}, cookies.get('token'));

    if (!response.token) {
      if (response.status !== 401) {
        return response;
      }

      cookies.delete('login-challenge', {path: '/login'});

      return {...response, step: 1};
    }

    cookies.delete('login-challenge', {path: '/login'});

    cookies.delete('login', {path: '/'});
    createCookie(cookies, 'token', response.token);

    redirect(302, '/dashboard');
  },
  checkRecovery: async ({request, cookies}) => {
    const form = await request.formData();

    const code = form.get('code');
    const challenge = cookies.get('login-challenge');

    const response = await fetchBackend('/auth/recovery', 'POST', {code, challenge}, cookies.get('token'));

    if (!response.token) {
      if (response.status !== 401) {
        return response;
      }

      cookies.delete('login-challenge', {path: '/login'});

      return {...response, step: 1};
    }

    cookies.delete('login-challenge', {path: '/login'});

    cookies.delete('login', {path: '/'});
    createCookie(cookies, 'token', response.token);

    redirect(302, '/dashboard');
  },
};
