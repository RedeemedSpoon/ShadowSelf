import type {PageServerLoad, Actions} from './$types';
import {fetchApi, createCookie} from '$lib';
import {redirect} from '@sveltejs/kit';
import QRCode from 'qrcode';

export const load: PageServerLoad = async () => {
  const response = await fetchApi('/settings', 'GET');
  return {settings: response};
};

export const actions: Actions = {
  username: async ({request, cookies}) => {
    const form = await request.formData();
    const username = form.get('username');

    const response = await fetchApi('/settings/username', 'PUT', {username});
    if (response.type === 'alert') return response;

    createCookie(cookies, 'token', response.cookie);
    return {message: 'Successfully changed username', type: 'success'};
  },
  password: async ({request, cookies}) => {
    const form = await request.formData();
    const password = form.get('password');

    const response = await fetchApi('/settings/password', 'PUT', {password});
    if (response.type === 'alert') return response;

    createCookie(cookies, 'token', response.cookie);
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
  toggleApi: async () => await fetchApi('/settings/toggleAPI'),
  api: async () => await fetchApi('/settings/api-key'),
  billing: async () => {},
  deleteBilling: async () => {},
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
