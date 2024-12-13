import {createCookie, fetchApi} from '$lib';
import {redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import QRCode from 'qrcode';

export const actions: Actions = {
  init: async ({request, cookies}) => {
    const form = await request.formData();
    const username = form.get('username') as string;
    const password = form.get('password') as string;

    const response = await fetchApi('/account/signup', 'POST', {username, password});
    if (!response.username) return response;

    const concat = `${username}&&${password}`;
    createCookie(cookies, 'signup', concat, true);

    return {step: 2, ...response};
  },

  askOTP: async ({request, cookies}) => {
    const form = await request.formData();
    const wantOTP = form.has('enable');

    if (wantOTP) {
      const username = cookies.get('signup')?.split('&&')[0];
      const response = await fetchApi('/account/signup-otp', 'POST', {username});
      if (!response.secret) return response;

      const cookie = cookies.get('signup')?.split('&&').slice(0, 2).join('&&');
      const concat = `${cookie}&&${response.secret}`;
      createCookie(cookies, 'signup', concat, true);

      const qr = await QRCode.toDataURL(response.uri);
      return {step: 3, secret: response.secret, qr};
    }

    const concat = cookies.get('signup')?.split('&&').slice(0, 2).join('&&') as string;
    createCookie(cookies, 'signup', concat, true);
    return {step: 6, secret: ''};
  },

  showOTP: async () => ({step: 4}),

  checkOTP: async ({request, cookies}) => {
    const form = await request.formData();
    const token = form.get('token');

    const secret = cookies.get('signup')?.split('&&')[2];
    const response = await fetchApi('/account/signup-recovery', 'POST', {token, secret});
    if (!response.recovery) return response;

    const cookie = cookies.get('signup')?.split('&&').slice(0, 3).join('&&');
    const concat = `${cookie}&&${response.recovery}`;
    createCookie(cookies, 'signup', concat, true);
    return {step: 5, ...response};
  },

  showRecovery: async () => ({step: 6}),

  askBilling: async ({request}) => {
    const form = await request.formData();
    const wantBilling = form.has('add');
    return wantBilling ? {step: 7} : {step: 8};
  },

  addBilling: async () => ({step: 8}),

  create: async ({cookies}) => {
    const concat = cookies.get('signup');
    const [username, password, secret, arrRecovery] = concat?.split('&&') ?? [];
    const recovery = arrRecovery?.split(',');

    const response = await fetchApi('/account/signup-create', 'POST', {username, password, secret, recovery});
    if (!response.cookie) return response;

    createCookie(cookies, 'token', response.cookie);
    cookies.delete('signup', {path: '/'});
    redirect(302, '/dashboard');
  },
};
