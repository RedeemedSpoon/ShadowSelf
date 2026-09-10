import {PUBLIC_STRIPE_KEY} from '$env/static/public';
import {fetchBackend} from '$utils/webfetch';
import {createCookie} from '$utils/shared';
import {redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import QRCode from 'qrcode';

export const actions: Actions = {
  init: async ({request, cookies}) => {
    const form = await request.formData();
    const email = form.get('email');
    const password = form.get('password');

    const response = await fetchBackend('/account/signup', 'POST', {email, password});
    if (!response.signup) return response;

    cookies.set('signup', response.signup, {
      path: '/signup',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: response.expiresIn,
    });
    cookies.delete('signup-payment', {path: '/signup'});

    return {step: 2, email};
  },
  checkEmail: async ({request, cookies}) => {
    const access = (await request.formData()).get('access');

    const response = await fetchBackend('/account/signup-email', 'POST', {signup: cookies.get('signup'), access});

    return response.email ? {step: 3} : response;
  },
  checkUsername: async ({request, cookies}) => {
    const username = (await request.formData()).get('username');

    const response = await fetchBackend('/account/signup-username', 'POST', {signup: cookies.get('signup'), username});

    return response.username ? {step: 4, ...response} : response;
  },
  askOTP: async ({request, cookies}) => {
    const enable = (await request.formData()).has('enable');

    const response = await fetchBackend('/account/signup-otp', 'POST', {signup: cookies.get('signup'), enable});
    if (response.type !== 'success') return response;
    if (!enable) return {step: 8, secret: ''};

    const svg = await QRCode.toString(response.uri, {type: 'svg', margin: 2});
    const qr = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    return {step: 5, secret: response.secret, qr};
  },
  showOTP: async () => ({step: 6}),
  checkOTP: async ({request, cookies}) => {
    const token = (await request.formData()).get('token');

    const response = await fetchBackend('/account/signup-recovery', 'POST', {signup: cookies.get('signup'), token});

    return response.recovery ? {step: 7, ...response} : response;
  },
  showRecovery: async () => ({step: 8}),
  askBilling: async ({request}) => {
    const wantBilling = (await request.formData()).has('add');

    return wantBilling ? {step: 9, stripeKey: PUBLIC_STRIPE_KEY} : {step: 10, stripeKey: ''};
  },
  addBilling: async ({request, cookies}) => {
    const payment = (await request.formData()).get('paymentID');
    if (typeof payment !== 'string' || !payment) return {step: 9};

    cookies.set('signup-payment', payment, {path: '/signup', httpOnly: true, secure: true, sameSite: 'strict', maxAge: 1800});

    return {step: 10};
  },
  create: async ({cookies}) => {
    const body = {signup: cookies.get('signup'), payment: cookies.get('signup-payment')};

    const response = await fetchBackend('/account/signup-create', 'POST', body);
    if (!response.cookie) return response;

    createCookie(cookies, 'token', response.cookie);
    cookies.delete('signup', {path: '/signup'});
    cookies.delete('signup-payment', {path: '/signup'});

    redirect(302, '/dashboard');
  },
};
