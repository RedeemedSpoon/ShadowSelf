import {PUBLIC_STRIPE_KEY} from '$env/static/public';
import {fetchBackend} from '$utils/webfetch';
import {createCookie} from '$utils/shared';
import {redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import QRCode from 'qrcode';

export const actions: Actions = {
  init: async ({request, cookies}) => {
    const form = await request.formData();
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    const response = await fetchBackend('/account/signup', 'POST', {email, password}, cookies.get('token'));
    if (!response.email) return response;

    createCookie(cookies, 'signup', email, true);

    return {step: 2, email};
  },
  checkEmail: async ({request, cookies}) => {
    const email = cookies.get('signup')?.split('&&')[0];
    const form = await request.formData();
    const access = form.get('access');

    const response = await fetchBackend('/account/signup-email', 'POST', {access, email}, cookies.get('token'));
    if (!response.email || !response.verification) return response;

    const cookie = cookies.get('signup')?.split('&&').join('&&');
    const concat = `${cookie}&&${response.verification}`;
    createCookie(cookies, 'signup', concat, true);

    return {step: 3};
  },
  checkUsername: async ({request, cookies}) => {
    const form = await request.formData();
    const username = form.get('username');

    const response = await fetchBackend('/account/signup-username', 'POST', {username}, cookies.get('token'));
    if (!response.username) return response;

    const cookie = cookies.get('signup')?.split('&&').join('&&');
    const concat = `${cookie}&&${username}`;
    createCookie(cookies, 'signup', concat, true);

    return {step: 4, ...response};
  },
  askOTP: async ({request, cookies}) => {
    const form = await request.formData();
    const wantOTP = form.has('enable');

    if (wantOTP) {
      const username = cookies.get('signup')?.split('&&')[2];
      const response = await fetchBackend('/account/signup-otp', 'POST', {username}, cookies.get('token'));
      if (!response.secret) return response;

      const cookie = cookies.get('signup')?.split('&&').join('&&');
      const concat = `${cookie}&&${response.secret}`;
      createCookie(cookies, 'signup', concat, true);

      const svg = await QRCode.toString(response.uri, {type: 'svg', margin: 2});
      const qr = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      return {step: 5, secret: response.secret, qr};
    }

    return {step: 8, secret: ''};
  },
  showOTP: async () => ({step: 6}),
  checkOTP: async ({request, cookies}) => {
    const form = await request.formData();
    const token = form.get('token');

    const secret = cookies.get('signup')?.split('&&')[3];
    const response = await fetchBackend('/account/signup-recovery', 'POST', {token, secret}, cookies.get('token'));
    if (!response.recovery) return response;

    const cookie = cookies.get('signup')?.split('&&').join('&&');
    const concat = `${cookie}&&${response.recovery}`;
    createCookie(cookies, 'signup', concat, true);

    return {step: 7, ...response};
  },
  showRecovery: async () => ({step: 8}),
  askBilling: async ({request}) => {
    const form = await request.formData();
    const wantBilling = form.has('add');

    if (wantBilling) {
      const stripeKey = PUBLIC_STRIPE_KEY;
      return {step: 9, stripeKey: stripeKey};
    }

    return {step: 10, stripeKey: ''};
  },
  addBilling: async ({request, cookies}) => {
    const form = await request.formData();
    const payment = form.get('paymentID');

    if (!payment) return {step: 9};
    const cookie = cookies.get('signup')?.split('&&').join('&&');
    const concat = `${cookie}&&${payment}`;
    createCookie(cookies, 'signup', concat, true);

    return {step: 10};
  },
  create: async ({request, cookies}) => {
    const form = await request.formData();
    const password = form.get('password') as string;
    const object = cookies.get('signup')?.split('&&') || [];
    const [email, verification, username] = object;
    let [secret, recovery, payment] = ['', [], ''] as [string, string[], string];

    const hasOTP = object[3]?.length === 32 && object[4]?.split(',')?.length === 6;
    const hasBilling = object[3]?.length === 27 || object[5]?.length === 27;

    if (hasOTP) {
      secret = object[3];
      recovery = object[4].split(',');
    }

    if (hasBilling) {
      payment = hasOTP ? object[5] : object[3];
    }

    const body = {email, verification, username, password, secret, recovery, payment};
    const response = await fetchBackend('/account/signup-create', 'POST', body, cookies.get('token'));
    if (!response.cookie) return response;

    createCookie(cookies, 'token', response.cookie);
    cookies.delete('signup', {path: '/'});
    redirect(302, '/dashboard');
  },
};
