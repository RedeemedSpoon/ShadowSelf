import {backend} from '$lib/backend.server';
import {createCookie} from '$utils/shared';
import {redirect, type Cookies} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import type {SignupState} from '$type';
import QRCode from 'qrcode';

interface SignupResponse {
  stage?: SignupState['stage'];
  verified?: boolean;
  email?: string;
  username?: string;
  secret?: string;
  uri?: string;
  recovery?: string[];
}

async function registrationState(response: SignupResponse): Promise<SignupState> {
  const qr = response.uri ? await QRCode.toDataURL(response.uri, {margin: 2}) : '';

  return {
    stage: response.stage || 'account',
    verified: response.verified || false,
    email: response.email || '',
    username: response.username || '',
    secret: response.secret || '',
    qr,
    recovery: response.recovery || [],
  };
}

async function loadRegistration(cookies: Cookies) {
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
}

async function advanceRegistration(cookies: Cookies, path: string, body: Record<string, unknown>) {
  const result = await backend<SignupResponse>(`/auth/registration/${path}`, 'POST', {
    signup: cookies.get('signup'),
    ...body,
  });

  if (!result.ok) {
    return {...(await loadRegistration(cookies)), message: result.error};
  }

  return {registration: await registrationState(result.data)};
}

async function completeRegistration(cookies: Cookies, savedRecovery = false) {
  const result = await backend<{token: string}>('/auth/registration/complete', 'POST', {
    signup: cookies.get('signup'),
    savedRecovery,
  });

  if (!result.ok) {
    return {...(await loadRegistration(cookies)), message: result.error};
  }

  createCookie(cookies, 'token', result.data.token);
  cookies.delete('signup', {path: '/signup'});

  redirect(303, '/dashboard');
}

export const load: PageServerLoad = ({cookies}) => loadRegistration(cookies);

export const actions: Actions = {
  init: async ({request, cookies}) => {
    const form = await request.formData();
    const credentials = {email: form.get('email'), password: form.get('password')};

    if (cookies.get('signup')) {
      return advanceRegistration(cookies, 'credentials', credentials);
    }

    const result = await backend<{signup: string; email: string; expiresIn: number}>('/auth/registration', 'POST', {
      ...credentials,
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

    return {registration: await registrationState({stage: 'email', email: result.data.email})};
  },
  verifyEmail: async ({request, cookies}) =>
    advanceRegistration(cookies, 'email', {access: (await request.formData()).get('access')}),
  setUsername: async ({request, cookies}) =>
    advanceRegistration(cookies, 'username', {username: (await request.formData()).get('username')}),
  chooseSecurity: async ({request, cookies}) => {
    const choice = (await request.formData()).get('enableTwoFactor');

    return advanceRegistration(cookies, 'security', {
      enableTwoFactor: choice === 'yes' ? true : choice === 'no' ? false : null,
    });
  },
  verifyAuthenticator: async ({request, cookies}) =>
    advanceRegistration(cookies, 'recovery', {token: (await request.formData()).get('token')}),
  create: async ({request, cookies}) => completeRegistration(cookies, (await request.formData()).has('savedRecovery')),
  back: async ({cookies}) => advanceRegistration(cookies, 'back', {}),
};
