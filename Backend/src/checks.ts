import type {BodyField, ContactDetail} from './types';
import {toTitleCase} from './utils';

export function check(body: BodyField, fields: string[], ignore?: boolean): BodyField {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return {err: `${toTitleCase(field)} is a required field`} as BodyField;
    }

    if (ignore) continue;
    switch (field) {
      case 'username':
        if (!/^[a-zA-Z0-9\s]+$/.test(body.username)) {
          return {err: 'Username can only contain letters, numbers and spaces'} as BodyField;
        } else if (body.username.length > 25) {
          return {err: 'Username is too long (<25 characters)'} as BodyField;
        }
        break;
      case 'password':
        if (!/^(?=.*?[a-z])(?=.*?[0-9]).{8,}$/.test(body.password)) {
          return {err: 'Password is too weak. Get a better one'} as BodyField;
        }
        break;
      case 'secret':
        if (body.secret.length > 32 && !/^[A-Z0-9]+$/.test(body.secret)) {
          return {err: 'OTP secret is invalid. Get a new one'} as BodyField;
        }
        break;
      case 'code':
        if (!/^\d{6}$/.test(body.code)) {
          return {err: 'Validation code must be a 6 digit number'} as BodyField;
        }
        break;
      case 'backup':
        if (!/^\d{9}$/.test(body.backup)) {
          return {err: 'Backup codes must be a 9 digit number'} as BodyField;
        }
        break;
      case 'backups':
        if (!Array.isArray(body.backups) || !body.backups.every((b) => /^\d{9}$/.test(b))) {
          return {err: 'Wrong backup codes structure. Generate new ones'} as BodyField;
        }
        break;
    }
  }

  return body;
}

export function checkContact(body: ContactDetail): ContactDetail {
  for (const field of ['category', 'message', 'subject']) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return {err: `${toTitleCase(field)} is a required field`} as ContactDetail;
    }
  }

  if (body.email && !/^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/gm.test(body.email)) {
    return {err: 'Please enter a valid email'} as ContactDetail;
  }

  if (!body.category.match(/^(question|feedback|collaboration|refund|bug|help|other)$/i)) {
    return {err: 'Please enter a valid category.'} as ContactDetail;
  }

  return body;
}
