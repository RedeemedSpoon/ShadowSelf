import type {Actions} from './$types';
import {dev} from '$app/environment';
import {fetchApi} from '$lib';
import QRCode from 'qrcode';

export const actions: Actions = {
  init: async ({request}) => {
    const form = await request.formData();
    const username = form.get('username');
    const password = form.get('password');

    const response = await fetchApi('/account/signup-first-step', 'POST', {username, password});
    if (!response.username) return {step: 1, ...response};

    return {step: 2, ...response};
  },
  askOTP: async ({request}) => {
    const form = await request.formData();
    const wantOTP = form.has('add');

    if (wantOTP) {
      const response = await fetchApi('/account/signup-second-step', 'POST');
      if (!response.secret) return {step: 2, ...response};

      const qr = await QRCode.toDataURL(response.uri);
      return {step: 3, secret: response.secret, qr};
    }

    return {step: 6};
  },
  showOTP: async () => {
    return {step: 4};
  },
  checkOTP: async ({request}) => {
    const form = await request.formData();
    const code = form.get('code');
    const secret = form.get('secret');

    const response = await fetchApi('/account/signup-third-step', 'POST', {code, secret});
    if (!response.backup) return {step: 4, ...response};

    return {step: 5, ...response};
  },
  showBackup: async () => {
    return {step: 6};
  },
  askBilling: async ({request}) => {
    const form = await request.formData();
    const wantBilling = form.has('add');

    if (wantBilling) return {step: 7};

    return {step: 8};
  },
  checkBilling: async ({request}) => {
    const form = await request.formData();
    const plan = form.get('plan');

    const response = {stripe: plan === 'lifetime'};
    if (!response.stripe) return {step: 7, ...response};

    return {step: 8};
  },
  create: async ({request, cookies}) => {
    const form = await request.formData();
    const username = form.get('username');
    const password = form.get('password');
    const secret = form.get('secret');
    const backup = form.get('backup');

    const response = await fetchApi('/account/signup-final-step', 'POST', {username, password, secret, backup});
    if (!response.cookie) return {step: 8, ...response};

    cookies.set('token', response.cookie, {
      path: '/',
      httpOnly: true,
      secure: true,
      domain: dev ? 'localhost' : 'shadowself.io',
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      priority: 'high',
    });
  },
};
