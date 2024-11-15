import type {Message, ContactDetail} from './types';
import {transporter} from './connection';
import * as bcrypt from 'bcrypt';

export async function attempt(func: Promise<unknown>): Promise<unknown> {
  try {
    return await func;
  } catch (error: unknown) {
    return error;
  }
}

export async function attemptMessage(func: Promise<unknown>, SuccessMessage: string): Promise<Message> {
  try {
    await func;
    return {message: SuccessMessage, type: 'success'};
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {message: error.message, type: 'alert'};
    }
    return {message: 'Something went horribly wrong.', type: 'alert'};
  }
}

export async function sendEmail(body: ContactDetail) {
  const mailOptions = {
    from: 'contact@shadowself.io',
    to: 'contact@shadowself.io',
    subject: `${body.category.toUpperCase()}: ` + body.subject,
    text: `${body.message}\n\nEmail: ${body.email || 'N/A'}`,
  };

  return await attemptMessage(transporter.sendMail(mailOptions), 'Your message has been sent!');
}

export async function hashAndSaltPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}
