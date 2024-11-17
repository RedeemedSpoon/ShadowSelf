import type {BodyField, ContactDetail, Message} from './types';
import {msg, toTitleCase} from './utils';

export function check(body: BodyField, fields: string[], ignore?: boolean): BodyField {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return {err: `${toTitleCase(field)} is a required field`} as BodyField;
    } else if (!ignore && field === 'username' && checkName(body.username)) {
      return {err: 'Username can only contain letters, numbers and spaces'} as BodyField;
    }
  }

  return body;
}

export function checkError(error: Error, field?: string): Message {
  if (field && error.message.match(/unique.*constraint/)) {
    return msg(`This ${field} is already taken`, 'alert');
  }

  if (error.message.match(/too long/)) {
    return msg(`${field} is too long (<${error.message.match(/\d+/)} characters)`, 'alert');
  }

  return msg(error.message, 'alert');
}

export function checkContact(body: ContactDetail): ContactDetail {
  for (const field of ['category', 'message', 'subject']) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return {err: `${toTitleCase(field)} is a required field`} as ContactDetail;
    }
  }

  if (body.email && !checkEmail(body.email)) {
    return {err: 'Please enter a valid email'} as ContactDetail;
  }

  if (!body.category.match(/^(question|feedback|collaboration|refund|bug|help|other)$/i)) {
    return {err: 'Please enter a valid category.'} as ContactDetail;
  }

  return body;
}

function checkEmail(email: string): boolean {
  return /^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/gm.test(email);
}

function checkName(name: string): boolean {
  return !/^[a-zA-Z0-9\s]+$/.test(name);
}
