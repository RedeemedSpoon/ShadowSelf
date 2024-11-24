import {createCookie, fetchApi} from '$lib';
import type {Actions} from './$types';
import QRCode from 'qrcode';

export const actions: Actions = {
  init: async ({request, cookies}) => {
    const form = await request.formData();
    const username = form.get('username') as string;
    const password = form.get('password') as string;

    const response = await fetchApi('/account/signup', 'POST', {username, password});
    if (!response.username) return {step: 1, ...response};

    const concat = `${username}&&${password}`;
    createCookie(cookies, 'signup', concat, true);

    return {step: 2, ...response};
  },
  askOTP: async ({request, cookies}) => {
    const form = await request.formData();
    const wantOTP = form.has('enable');

    if (wantOTP) {
      const response = await fetchApi('/account/signup-otp', 'POST');
      if (!response.secret) return {step: 2, ...response};

      const concat = `${cookies.get('signup')}&&${response.secret}`;
      createCookie(cookies, 'signup', concat, true);

      const qr = await QRCode.toDataURL(response.uri);
      return {step: 3, secret: response.secret, qr};
    }

    return {step: 6};
  },
  showOTP: async () => ({step: 4}),
  checkOTP: async ({request, cookies}) => {
    const form = await request.formData();
    const code = form.get('code');

    const secret = cookies.get('signup')?.split('&&')[2];
    const response = await fetchApi('/account/signup-backup', 'POST', {code, secret});
    if (!response.backup) return {step: 4, ...response};

    const concat = `${cookies.get('signup')}&&${response.backup}`;
    createCookie(cookies, 'signup', concat, true);
    return {step: 5, ...response};
  },
  showBackup: async () => ({step: 6}),
  askBilling: async ({request}) => {
    const form = await request.formData();
    const wantBilling = form.has('add');

    if (wantBilling) return {step: 7};

    return {step: 8};
  },
  addBilling: async () => ({step: 8}),
  create: async ({cookies}) => {
    const concat = cookies.get('signup');
    const [username, password, secret, rawBackups] = concat?.split('&&') ?? [];
    const backups = rawBackups?.split(',');

    const response = await fetchApi('/account/signup-create', 'POST', {username, password, secret, backups});
    if (!response.cookie) return {step: 8, ...response};

    createCookie(cookies, 'token', response.cookie);
    cookies.delete('signup', {path: '/'});
  },
};
