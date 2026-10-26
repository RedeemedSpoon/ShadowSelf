import {fetchBackend} from '$lib/backend.server';
import {createCookie} from '$utils/shared';
import {redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import type {Cookies, RequestEvent} from '@sveltejs/kit';

function completeLogin(cookies: Cookies, response: Awaited<ReturnType<typeof fetchBackend>>) {
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

  cookies.set('login-challenge', response.challenge, {
    path: '/login',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: response.expiresIn,
  });

  return {step: 4};
}

async function verifySecondFactor({request, cookies}: RequestEvent, path: string, field: 'token' | 'code') {
  const form = await request.formData();
  const challenge = cookies.get('login-challenge');

  const response = await fetchBackend(path, 'POST', {[field]: form.get(field), challenge}, cookies.get('token'));

  if (!response.token && response.status !== 401) {
    return response;
  }

  cookies.delete('login-challenge', {path: '/login'});

  if (!response.token) {
    return {...response, step: 1};
  }

  cookies.delete('login', {path: '/'});

  return completeLogin(cookies, response);
}

export const actions: Actions = {
  checkCredentials: async ({request, cookies}) => {
    cookies.delete('login-challenge', {path: '/login'});

    const form = await request.formData();
    const password = form.get('password');
    const email = form.get('email');

    const response = await fetchBackend('/auth/password', 'POST', {email, password}, cookies.get('token'));

    return completeLogin(cookies, response);
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

    if (response.challenge || response.token) {
      cookies.delete('login', {path: '/'});
    }

    return completeLogin(cookies, response);
  },
  checkOTP: (event) => verifySecondFactor(event, '/auth/second-factor', 'token'),
  checkRecovery: (event) => verifySecondFactor(event, '/auth/recovery', 'code'),
};
