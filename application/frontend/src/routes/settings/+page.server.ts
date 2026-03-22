import type {PageServerLoad, Actions} from './$types';
import {PUBLIC_STRIPE_KEY} from '$env/static/public';
import {fetchBackend} from '$utils/webfetch';
import {createCookie} from '$utils/shared';
import {redirect} from '@sveltejs/kit';
import QRCode from 'qrcode';

export const load: PageServerLoad = async ({cookies}) => {
  const response = await fetchBackend('/settings/', 'GET', undefined, cookies.get('token'));
  const stripeKey = PUBLIC_STRIPE_KEY;
  return {settings: response, stripeKey};
};

export const actions: Actions = {
  email: async ({request, cookies}) => {
    const form = await request.formData();
    const email = form.get('email');

    const response = await fetchBackend('/settings/email', 'PUT', {email}, cookies.get('token'));
    if (response.type === 'alert') return response;
    return {toggleModel: true, email};
  },
  access: async ({request, cookies}) => {
    const form = await request.formData();
    const access = form.get('access');
    const email = form.get('email');

    const response = await fetchBackend('/settings/email', 'POST', {email, access}, cookies.get('token'));
    if (response.type === 'alert') return response;

    createCookie(cookies, 'token', response.cookie);
    return {toggleModel: false, message: 'Successfully changed email address', type: 'success'};
  },
  username: async ({request, cookies}) => {
    const form = await request.formData();
    const username = form.get('username');

    const response = await fetchBackend('/settings/username', 'PUT', {username}, cookies.get('token'));
    if (response.type === 'alert') return response;
    return {message: 'Successfully changed username', type: 'success', username};
  },
  password: async ({request, cookies}) => {
    const form = await request.formData();
    const password = form.get('password');

    const response = await fetchBackend('/settings/password', 'PUT', {password}, cookies.get('token'));
    if (response.type === 'alert') return response;
    return {message: 'Successfully changed password', type: 'success'};
  },
  generateOtp: async ({cookies}) => {
    const response = await fetchBackend('/settings/otp', 'GET', undefined, cookies.get('token'));
    const svg = await QRCode.toString(response.uri, {type: 'svg', margin: 2});
    const qr = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    return {step: 1, secret: response.secret, qr};
  },
  nextOtp: async () => ({step: 2}),
  checkOtp: async ({request, cookies}) => {
    const form = await request.formData();
    const secret = form.get('secret');
    const token = form.get('token');

    const response = await fetchBackend('/settings/otp-check', 'POST', {token, secret}, cookies.get('token'));
    if (response.type === 'alert') return {step: 2, ...response};
    return {step: 3};
  },
  otp: async ({request, cookies}) => {
    const form = await request.formData();
    const secret = form.get('secret');

    const response = await fetchBackend('/settings/otp', 'POST', {secret}, cookies.get('token'));
    return {step: 1, OTP: true, ...response};
  },
  deleteOtp: async ({cookies}) => {
    const response = await fetchBackend('/settings/otp', 'DELETE', undefined, cookies.get('token'));
    return {OTP: false, ...response};
  },
  recovery: async ({cookies}) => await fetchBackend('/settings/recovery', 'GET', undefined, cookies.get('token')),
  toggleApi: async ({cookies}) => await fetchBackend('/settings/api-access', 'GET', undefined, cookies.get('token')),
  api: async ({cookies}) => await fetchBackend('/settings/api-key', 'GET', undefined, cookies.get('token')),
  payment: async ({request, cookies}) => {
    const form = await request.formData();
    const payment = form.get('paymentID');

    const response = await fetchBackend('/settings/payment', 'POST', {payment}, cookies.get('token'));
    if (!response.sessionUrl) return response;
    return {sessionUrl: response.sessionUrl, message: 'Successfully added payment method', type: 'success'};
  },
  session: async ({request, cookies}) => {
    const form = await request.formData();
    if (form.has('revoke')) await fetchBackend('/settings/revoke', 'GET', undefined, cookies.get('token'));
    redirect(302, '/logout');
  },
  delete: async ({cookies}) => {
    await fetchBackend('/settings/full', 'DELETE', undefined, cookies.get('token'));
    redirect(302, '/logout');
  },
};
