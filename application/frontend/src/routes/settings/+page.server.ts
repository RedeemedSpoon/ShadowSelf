import type {PageServerLoad, Actions} from './$types';
import {PUBLIC_STRIPE_KEY} from '$env/static/public';
import {fetchBackend} from '$utils/webfetch';
import {createCookie} from '$utils/shared';
import {redirect} from '@sveltejs/kit';
import QRCode from 'qrcode';

export const load: PageServerLoad = async ({cookies, setHeaders}) => {
  setHeaders({'cache-control': 'no-store'});

  const response = await fetchBackend('/settings/', 'GET', undefined, cookies.get('token'));
  const stripeKey = PUBLIC_STRIPE_KEY;

  return {settings: response, stripeKey};
};

export const actions: Actions = {
  portal: async ({request, cookies}) => {
    const currentPassword = (await request.formData()).get('currentPassword');

    return await fetchBackend('/settings/portal', 'POST', {currentPassword}, cookies.get('token'));
  },
  email: async ({request, cookies}) => {
    const form = await request.formData();
    const email = form.get('email');

    const response = await fetchBackend('/settings/email', 'PUT', {email, currentPassword: form.get('currentPassword')}, cookies.get('token'));
    if (response.type !== 'success') return response;

    return {toggleModel: true, email};
  },
  access: async ({request, cookies}) => {
    const form = await request.formData();
    const access = form.get('access');
    const email = form.get('email');

    const response = await fetchBackend('/settings/email', 'POST', {email, access, currentPassword: form.get('currentPassword')}, cookies.get('token'));
    if (response.type !== 'success') return response;

    createCookie(cookies, 'token', response.cookie);

    return {toggleModel: false, message: 'Successfully changed email address', type: 'success'};
  },
  username: async ({request, cookies}) => {
    const form = await request.formData();
    const username = form.get('username');

    const response = await fetchBackend('/settings/username', 'PUT', {username, currentPassword: form.get('currentPassword')}, cookies.get('token'));
    if (response.type !== 'success') return response;

    return {message: 'Successfully changed username', type: 'success', username};
  },
  password: async ({request, cookies}) => {
    const form = await request.formData();
    const password = form.get('password');

    const response = await fetchBackend('/settings/password', 'PUT', {password, currentPassword: form.get('currentPassword')}, cookies.get('token'));
    if (response.type !== 'success') return response;

    cookies.delete('token', {path: '/'});
    redirect(303, '/login');
  },
  generateOtp: async ({cookies}) => {
    const response = await fetchBackend('/settings/otp', 'GET', undefined, cookies.get('token'));
    if (response.type !== 'success') return response;

    const svg = await QRCode.toString(response.uri, {type: 'svg', margin: 2});
    const qr = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    return {step: 1, secret: response.secret, qr};
  },
  nextOtp: async () => ({step: 2}),
  checkOtp: async ({request, cookies}) => {
    const form = await request.formData();
    const secret = form.get('secret');
    const token = form.get('token');

    const response = await fetchBackend('/settings/otp', 'POST', {token, secret, currentPassword: form.get('currentPassword')}, cookies.get('token'));
    if (response.type !== 'success') return {step: 2, ...response};

    return {step: 3, OTP: true, ...response};
  },
  otp: async () => ({step: 1}),
  deleteOtp: async ({request, cookies}) => {
    const currentPassword = (await request.formData()).get('currentPassword');
    const response = await fetchBackend('/settings/otp', 'DELETE', {currentPassword}, cookies.get('token'));
    if (response.type !== 'success') return response;

    return {OTP: false, ...response};
  },
  recovery: async ({request, cookies}) => {
    const password = (await request.formData()).get('password');

    return await fetchBackend('/settings/recovery', 'POST', {password}, cookies.get('token'));
  },
  toggleApi: async ({request, cookies}) => {
    const currentPassword = (await request.formData()).get('currentPassword');

    return await fetchBackend('/settings/api-access', 'POST', {currentPassword}, cookies.get('token'));
  },
  api: async ({request, cookies}) => {
    const currentPassword = (await request.formData()).get('currentPassword');

    return await fetchBackend('/settings/api-key', 'POST', {currentPassword}, cookies.get('token'));
  },
  payment: async ({request, cookies}) => {
    const form = await request.formData();
    const payment = form.get('paymentID');

    const response = await fetchBackend('/settings/payment', 'POST', {payment, currentPassword: form.get('currentPassword')}, cookies.get('token'));
    if (!response.sessionUrl) return response;

    return {sessionUrl: response.sessionUrl, message: 'Successfully added payment method', type: 'success'};
  },
  session: async ({request, cookies}) => {
    const form = await request.formData();
    const path = form.has('revoke') ? '/settings/revoke' : '/settings/logout';
    const response = await fetchBackend(path, 'POST', {}, cookies.get('token'));
    if (response.type !== 'success') return response;

    cookies.delete('token', {path: '/'});
    redirect(303, '/login');
  },
  delete: async ({request, cookies}) => {
    const currentPassword = (await request.formData()).get('currentPassword');
    const response = await fetchBackend('/settings/full', 'DELETE', {currentPassword}, cookies.get('token'));
    if (response.type !== 'success') return response;

    cookies.delete('token', {path: '/'});
    redirect(303, '/');
  },
};
