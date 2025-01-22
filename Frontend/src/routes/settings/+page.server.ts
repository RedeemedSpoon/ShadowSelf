import type {PageServerLoad, Actions} from './$types';
import {fetchApi, createCookie} from '$lib';
import {redirect} from '@sveltejs/kit';
import QRCode from 'qrcode';

export const load: PageServerLoad = async () => {
  const response = await fetchApi('/settings/', 'GET');
  const stripeKey = process.env.STRIPE_PUBLISHABLE_KEY;
  return {settings: response, stripeKey};
};

export const actions: Actions = {
  email: async ({request}) => {
    const form = await request.formData();
    const email = form.get('email');

    const response = await fetchApi('/settings/email', 'PUT', {email});
    if (response.type === 'alert') return response;
    return {toggleModel: true, email};
  },
  access: async ({request, cookies}) => {
    const form = await request.formData();
    const access = form.get('access');
    const email = form.get('email');

    const response = await fetchApi('/settings/email', 'POST', {email, access});
    if (response.type === 'alert') return response;

    createCookie(cookies, 'token', response.cookie);
    return {toggleModel: false, message: 'Successfully changed email address', type: 'success'};
  },
  username: async ({request}) => {
    const form = await request.formData();
    const username = form.get('username');

    const response = await fetchApi('/settings/username', 'PUT', {username});
    if (response.type === 'alert') return response;
    return {message: 'Successfully changed username', type: 'success'};
  },
  password: async ({request}) => {
    const form = await request.formData();
    const password = form.get('password');

    const response = await fetchApi('/settings/password', 'PUT', {password});
    if (response.type === 'alert') return response;
    return {message: 'Successfully changed password', type: 'success'};
  },
  generateOtp: async () => {
    const response = await fetchApi('/settings/otp', 'GET');
    const qr = await QRCode.toDataURL(response.uri);
    return {step: 1, secret: response.secret, qr};
  },
  nextOtp: async () => ({step: 2}),
  checkOtp: async ({request}) => {
    const form = await request.formData();
    const secret = form.get('secret');
    const token = form.get('token');

    const response = await fetchApi('/settings/otp-check', 'POST', {token, secret});
    if (response.type === 'alert') return {step: 2, ...response};
    return {step: 3};
  },
  otp: async ({request}) => {
    const form = await request.formData();
    const secret = form.get('secret');

    const response = await fetchApi('/settings/otp', 'POST', {secret});
    return {step: 1, OTP: true, ...response};
  },
  deleteOtp: async () => {
    const response = await fetchApi('/settings/otp', 'DELETE');
    return {OTP: false, ...response};
  },
  recovery: async () => await fetchApi('/settings/recovery'),
  toggleApi: async () => await fetchApi('/settings/api-access'),
  api: async () => await fetchApi('/settings/api-key'),
  payment: async ({request}) => {
    const form = await request.formData();
    const payment = form.get('paymentID');

    const response = await fetchApi('/settings/payment', 'POST', {payment});
    if (!response.sessionUrl) return response;
    return {sessionUrl: response.sessionUrl, message: 'Successfully added payment method', type: 'success'};
  },
  session: async ({request, cookies}) => {
    const form = await request.formData();
    if (form.has('revoke')) await fetchApi('/settings/revoke', 'GET');

    cookies.delete('token', {path: '/'});
    redirect(302, '/');
  },
  delete: async ({cookies}) => {
    await fetchApi('/settings/full', 'DELETE');
    cookies.delete('token', {path: '/'});
    redirect(302, '/');
  },
};
