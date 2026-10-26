import type {PageServerLoad, Actions} from './$types';
import {env} from '$env/dynamic/public';
import {backend, fetchBackend} from '$lib/backend.server';
import {createCookie} from '$utils/shared';
import {redirect} from '@sveltejs/kit';
import QRCode from 'qrcode';

export const load: PageServerLoad = async ({cookies, setHeaders}) => {
  setHeaders({'cache-control': 'no-store'});

  const response = await fetchBackend('/settings', 'GET', undefined, cookies.get('token'));

  const sessions = await backend<{sessions: {id: string; current: boolean}[]}>(
    '/settings/sessions',
    'GET',
    undefined,
    cookies.get('token'),
  );

  const stripeKey = env.PUBLIC_STRIPE_KEY || '';

  return {
    settings: response,
    stripeKey,
    sessions: sessions.ok ? sessions.data.sessions : [],
    sessionsError: sessions.ok ? '' : sessions.error,
  };
};

export const actions: Actions = {
  revokeSession: async ({request, cookies}) => {
    const form = await request.formData();

    const response = await fetchBackend('/settings/sessions', 'DELETE', {id: form.get('id')}, cookies.get('token'));

    if (response.type !== 'success') {
      return response;
    }

    if (form.get('current') === 'true') {
      cookies.delete('token', {path: '/'});
      redirect(303, '/login');
    }

    return response;
  },
  portal: async ({cookies}) => {
    const response = await fetchBackend('/settings/billing-portal', 'POST', {}, cookies.get('token'));

    if (response.type !== 'success' || !response.sessionUrl) {
      return response;
    }

    redirect(303, response.sessionUrl);
  },
  email: async ({request, cookies}) => {
    const form = await request.formData();

    const email = form.get('email');

    const response = await fetchBackend(
      '/settings/email',
      'POST',
      {email, currentPassword: form.get('currentPassword')},
      cookies.get('token'),
    );

    if (response.type !== 'success') {
      return response;
    }

    return {toggleModel: true, email};
  },
  access: async ({request, cookies}) => {
    const form = await request.formData();

    const access = form.get('access');
    const email = form.get('email');

    const response = await fetchBackend(
      '/settings/email',
      'PUT',
      {email, access, currentPassword: form.get('currentPassword')},
      cookies.get('token'),
    );

    if (response.type !== 'success') {
      return response;
    }

    createCookie(cookies, 'token', response.token);

    return {
      toggleModel: false,
      message: response.warning || 'Successfully changed email address',
      type: response.warning ? 'info' : 'success',
    };
  },
  username: async ({request, cookies}) => {
    const form = await request.formData();

    const username = form.get('username');

    const response = await fetchBackend('/settings/username', 'PUT', {username}, cookies.get('token'));

    if (response.type !== 'success') {
      return response;
    }

    return {message: 'Successfully changed username', type: 'success', username};
  },
  password: async ({request, cookies}) => {
    const form = await request.formData();

    const password = form.get('password');

    const response = await fetchBackend(
      '/settings/password',
      'PUT',
      {password, currentPassword: form.get('currentPassword')},
      cookies.get('token'),
    );

    if (response.type !== 'success') {
      return response;
    }

    cookies.delete('token', {path: '/'});
    redirect(303, '/login');
  },
  generateOtp: async ({cookies}) => {
    const response = await fetchBackend('/settings/totp', 'GET', undefined, cookies.get('token'));

    if (response.type !== 'success') {
      return response;
    }

    const svg = await QRCode.toString(response.uri, {type: 'svg', margin: 2});

    const qr = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    return {secret: response.secret, qr};
  },
  checkOtp: async ({request, cookies}) => {
    const form = await request.formData();

    const secret = form.get('secret');
    const token = form.get('token');

    const response = await fetchBackend(
      '/settings/totp',
      'POST',
      {token, secret, currentPassword: form.get('currentPassword')},
      cookies.get('token'),
    );

    return response;
  },
  deleteOtp: async ({request, cookies}) => {
    const currentPassword = (await request.formData()).get('currentPassword');

    const response = await fetchBackend('/settings/totp', 'DELETE', {currentPassword}, cookies.get('token'));

    return response;
  },
  recovery: async ({request, cookies}) => {
    const password = (await request.formData()).get('password');

    return await fetchBackend('/settings/recovery', 'POST', {password}, cookies.get('token'));
  },
  toggleApi: async ({request, cookies}) => {
    const form = await request.formData();

    const enabled = form.get('enabled') === 'true';

    return await fetchBackend('/settings/api-access', 'PUT', {enabled}, cookies.get('token'));
  },
  api: async ({cookies}) => {
    return await fetchBackend('/settings/api-key', 'POST', {}, cookies.get('token'));
  },
  payment: async ({request, cookies}) => {
    const form = await request.formData();

    const response = await fetchBackend(
      '/settings/payment',
      'POST',
      {setupIntent: form.get('setupIntent')},
      cookies.get('token'),
    );

    if (response.type !== 'success') {
      return response;
    }

    return {message: 'Payment card saved for future subscription payments.', type: 'success'};
  },
  session: async ({request, cookies}) => {
    const form = await request.formData();

    const path = form.has('revoke') ? '/settings/sessions' : '/settings/session';
    const response = await fetchBackend(path, 'DELETE', {}, cookies.get('token'));

    if (response.type !== 'success') {
      return response;
    }

    cookies.delete('token', {path: '/'});
    redirect(303, '/login');
  },
  delete: async ({request, cookies}) => {
    const form = await request.formData();
    const currentPassword = form.get('currentPassword');
    const refundAddress = form.get('refundAddress') || undefined;

    const response = await fetchBackend(
      '/settings/account',
      'DELETE',
      {currentPassword, refundAddress},
      cookies.get('token'),
    );

    if (response.type !== 'success') {
      return response;
    }

    cookies.delete('token', {path: '/'});
    redirect(303, '/');
  },
};
