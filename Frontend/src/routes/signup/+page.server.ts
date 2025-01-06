import {createCookie, fetchApi} from '$lib';
import {redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import QRCode from 'qrcode';

export const actions: Actions = {
  init: async ({request, cookies}) => {
    const form = await request.formData();
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    const response = await fetchApi('/account/signup', 'POST', {email, password});
    if (!response.email) return response;

    const concat = `${email}&&${password}`;
    createCookie(cookies, 'signup', concat, true);

    return {step: 2, email};
  },
  checkEmail: async ({request, cookies}) => {
    const email = cookies.get('signup')?.split('&&')[0];
    const form = await request.formData();
    const access = form.get('access');

    const response = await fetchApi('/account/signup-email', 'POST', {access, email});
    if (!response.email) return response;

    const cookie = cookies.get('signup')?.split('&&').slice(0, 2).join('&&');
    const concat = `${cookie}&&${access}`;
    createCookie(cookies, 'signup', concat, true);

    return {step: 3};
  },
  checkUsername: async ({request, cookies}) => {
    const form = await request.formData();
    const username = form.get('username');

    const response = await fetchApi('/account/signup-username', 'POST', {username});
    if (!response.username) return response;

    const cookie = cookies.get('signup')?.split('&&').slice(0, 3).join('&&');
    const concat = `${cookie}&&${username}`;
    createCookie(cookies, 'signup', concat, true);

    return {step: 4, ...response};
  },
  askOTP: async ({request, cookies}) => {
    const form = await request.formData();
    const wantOTP = form.has('enable');

    if (wantOTP) {
      const username = cookies.get('signup')?.split('&&')[3];
      const response = await fetchApi('/account/signup-otp', 'POST', {username});
      if (!response.secret) return response;

      const cookie = cookies.get('signup')?.split('&&').slice(0, 4).join('&&');
      const concat = `${cookie}&&${response.secret}`;
      createCookie(cookies, 'signup', concat, true);

      const qr = await QRCode.toDataURL(response.uri);
      return {step: 5, secret: response.secret, qr};
    }

    return {step: 8, secret: ''};
  },
  showOTP: async () => ({step: 6}),
  checkOTP: async ({request, cookies}) => {
    const form = await request.formData();
    const token = form.get('token');

    const secret = cookies.get('signup')?.split('&&')[4];
    const response = await fetchApi('/account/signup-recovery', 'POST', {token, secret});
    if (!response.recovery) return response;

    const cookie = cookies.get('signup')?.split('&&').slice(0, 5).join('&&');
    const concat = `${cookie}&&${response.recovery}`;
    createCookie(cookies, 'signup', concat, true);

    return {step: 7, ...response};
  },
  showRecovery: async () => ({step: 8}),
  askBilling: async ({request}) => {
    const form = await request.formData();
    const wantBilling = form.has('add');
    return wantBilling ? {step: 9} : {step: 10};
  },
  addBilling: async () => ({step: 10}),
  create: async ({cookies}) => {
    const concat = cookies.get('signup');
    const [email, password, access, username, secret, arrRecovery] = concat?.split('&&') ?? [];
    const recovery = arrRecovery?.split(',');

    const response = await fetchApi('/account/signup-create', 'POST', {email, access, username, password, secret, recovery});
    if (!response.cookie) return response;

    createCookie(cookies, 'token', response.cookie);
    cookies.delete('signup', {path: '/'});
    redirect(302, '/dashboard');
  },
};
