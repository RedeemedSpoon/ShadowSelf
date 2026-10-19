import {backend} from '$lib/backend.server';
import {createCookie} from '$utils/shared';
import {redirect, type Cookies} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import type {SignupState} from '$type';
import QRCode from 'qrcode';

interface SignupResponse {
  stage?: 'email' | 'authenticator' | 'recovery';
  ready?: boolean;
  email?: string;
  username?: string;
  secret?: string;
  uri?: string;
  recovery?: string[];
}

async function registrationState(response: SignupResponse): Promise<SignupState> {
  const qr = response.uri ? await QRCode.toDataURL(response.uri, {margin: 2}) : '';

  return {
    stage: response.ready ? 'complete' : response.stage || 'account',
    email: response.email || '',
    username: response.username || '',
    secret: response.secret || '',
    qr,
    recovery: response.recovery || [],
  };
}

async function completeRegistration(cookies: Cookies, savedRecovery = false) {
  const result = await backend<{token: string}>('/auth/registration/complete', 'POST', {
    signup: cookies.get('signup'),
    savedRecovery,
  });

  if (!result.ok) {
    return {message: result.error};
  }

  createCookie(cookies, 'token', result.data.token);
  cookies.delete('signup', {path: '/signup'});

  redirect(303, '/dashboard');
}

export const load: PageServerLoad = async ({cookies}) => {
  const signup = cookies.get('signup');

  if (!signup) {
    return {registration: await registrationState({}), message: ''};
  }

  const result = await backend<SignupResponse>('/auth/registration/resume', 'POST', {signup});

  if (!result.ok) {
    if (result.status === 410) {
      cookies.delete('signup', {path: '/signup'});
    }

    return {registration: await registrationState({}), message: result.error};
  }

  return {registration: await registrationState(result.data), message: ''};
};

export const actions: Actions = {
  init: async ({request, cookies}) => {
    const form = await request.formData();
    const result = await backend<{signup: string; expiresIn: number}>('/auth/registration', 'POST', {
      email: form.get('email'),
      password: form.get('password'),
      username: form.get('username'),
      enableTwoFactor: form.has('enableTwoFactor'),
    });

    if (!result.ok) {
      return {message: result.error};
    }

    cookies.set('signup', result.data.signup, {
      path: '/signup',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: result.data.expiresIn,
    });

    return {
      registration: await registrationState({
        stage: 'email',
        email: String(form.get('email')),
        username: String(form.get('username')),
      }),
    };
  },
  verifyEmail: async ({request, cookies}) => {
    const form = await request.formData();
    const result = await backend<SignupResponse>('/auth/registration/email', 'POST', {
      signup: cookies.get('signup'),
      access: form.get('access'),
    });

    if (!result.ok) {
      return {message: result.error};
    }

    if (result.data.ready) {
      return completeRegistration(cookies);
    }

    return {registration: await registrationState(result.data)};
  },
  verifyAuthenticator: async ({request, cookies}) => {
    const token = (await request.formData()).get('token');
    const result = await backend<SignupResponse>('/auth/registration/recovery', 'POST', {
      signup: cookies.get('signup'),
      token,
    });

    if (!result.ok) {
      return {message: result.error};
    }

    return {registration: await registrationState({...result.data, stage: 'recovery'})};
  },
  create: async ({request, cookies}) => completeRegistration(cookies, (await request.formData()).has('savedRecovery')),
  restart: async ({cookies}) => {
    const signup = cookies.get('signup');

    if (signup) {
      const result = await backend('/auth/registration/cancel', 'POST', {signup});

      if (!result.ok) {
        return {message: result.error};
      }
    }

    cookies.delete('signup', {path: '/signup'});

    return {registration: await registrationState({})};
  },
};
