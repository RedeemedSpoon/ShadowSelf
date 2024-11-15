import type {Message, ContactDetail} from './types';
import {transporter} from './connection';
import {genSalt, hash} from 'bcrypt';

export async function attemptQuery(func: Promise<unknown>): Promise<unknown> {
  try {
    return await func;
  } catch (error: unknown) {
    return error;
  }
}

export async function attempt(func: Promise<unknown>, SuccessMessage: string): Promise<Message> {
  try {
    await func;
    return msg(SuccessMessage, 'success');
  } catch (error: unknown) {
    if (error instanceof Error) return msg(error.message, 'alert');
    return msg('Something went horribly wrong.', 'alert');
  }
}

export async function sendEmail(body: ContactDetail) {
  const mailOptions = {
    from: 'contact@shadowself.io',
    to: 'contact@shadowself.io',
    subject: `${body.category.toUpperCase()}: ` + body.subject,
    text: `${body.message}\n\nEmail: ${body.email || 'N/A'}`,
  };

  return await attempt(transporter.sendMail(mailOptions), 'Your message has been sent!');
}

export async function hashAndSaltPassword(password: string): Promise<string> {
  return await hash(password, await genSalt(5));
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export function msg(message: Message['message'], type: Message['type']): Message {
  return {message, type};
}
