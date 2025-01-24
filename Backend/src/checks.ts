import type {BodyField, ContactDetail} from './types';
import {toTitleCase} from './utils';

export function check(rawBody: unknown, fields: string[], ignore?: boolean): BodyField {
  const body = rawBody as BodyField;

  for (const field of fields) {
    const isOptional = field.startsWith('?');
    const fieldType = isOptional ? field.slice(1) : field;

    if (!Object.prototype.hasOwnProperty.call(body, field) && !isOptional) {
      return {err: `${toTitleCase(field)} is a required field`} as BodyField;
    }

    if (ignore) continue;
    if (isOptional && !body[fieldType as keyof BodyField]) continue;

    switch (fieldType) {
      case 'username':
        if (!/^[\p{L}\p{N}\s]+$/u.test(body.username)) {
          return {err: 'Username can only contain letters, numbers and spaces'} as BodyField;
        } else if (body.username.length > 25) {
          return {err: 'Username is too long (<25 characters)'} as BodyField;
        }
        break;

      case 'password':
        if (!/^(?=.*?[a-z])(?=.*?[0-9]).{8,}$/.test(body.password)) {
          return {err: 'Password is too weak. Improve it a bit'} as BodyField;
        }
        break;

      case 'email':
        if (!/^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/gm.test(body.email)) {
          return {err: 'Invalid email address. Please try again'} as BodyField;
        } else if (body.email.length > 48) {
          return {err: 'Email is too long (<48 characters)'} as BodyField;
        }
        break;

      case 'access':
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/.test(body.access)) {
          return {err: 'Invalid access token. Please try again'} as BodyField;
        }
        break;

      case 'secret':
        if (body.secret.length > 32 && !/^[A-Z0-9]+$/.test(body.secret)) {
          return {err: 'OTP secret is invalid. Get a new one'} as BodyField;
        }
        break;

      case 'token':
        if (!/^\d{6}$/.test(body.token)) {
          return {err: 'Validation token must be a 6 digit number'} as BodyField;
        }
        break;

      case 'code':
        if (!/^\d{9}$/.test(body.code)) {
          return {err: 'recovery codes must be a 9 digit number'} as BodyField;
        }
        break;

      case 'recovery':
        if (!Array.isArray(body.recovery) || !body.recovery.every((b) => /^\d{9}$/.test(b))) {
          return {err: 'Wrong recovery codes structure. Generate new ones'} as BodyField;
        }
        break;

      case 'payment':
        if (body.payment.length !== 27 || !body.payment.startsWith('pm_')) {
          return {err: 'Payment method is invalid. Please try again'} as BodyField;
        }
        break;

      case 'intent':
        if (body.intent.length !== 27 || !body.intent.startsWith('pi_')) {
          return {err: 'Payment Intent is invalid. Please try again'} as BodyField;
        }
        break;

      case 'subscription':
        if (body.subscription.length !== 28 || !body.subscription.startsWith('sub_')) {
          return {err: 'Subscription ID is invalid. Please try again'} as BodyField;
        }
        break;
    }
  }

  return body;
}

export function checkContact(Rawbody: unknown): ContactDetail {
  const body = Rawbody as ContactDetail;

  for (const field of ['category', 'message', 'subject']) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return {err: `${toTitleCase(field)} is a required field`} as ContactDetail;
    }
  }

  if (body.subject.length > 120) {
    return {err: 'Subject is too long (<120 characters)'} as ContactDetail;
  }

  if (body.email && !/^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/gm.test(body.email)) {
    return {err: 'Please enter a valid email'} as ContactDetail;
  }

  if (!body.category.match(/^(question|feedback|collaboration|refund|bug|help|other)$/i)) {
    return {err: 'Please enter a valid category'} as ContactDetail;
  }

  return body;
}
