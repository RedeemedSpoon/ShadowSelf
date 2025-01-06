import type {ContactDetail, QueryResult} from './types';
import {contactTransporter, verificationTransporter} from './connection';

export async function attempt(func: Promise<unknown>): Promise<QueryResult[]> {
  try {
    return (await func) as QueryResult[];
  } catch (error) {
    return error as QueryResult[];
  }
}

export async function contact(body: ContactDetail) {
  const mailOptions = {
    from: 'contact@shadowself.io',
    to: 'contact@shadowself.io',
    subject: `${body.category.toUpperCase()}: ` + body.subject,
    text: `${body.message}\n\nEmail: ${body.email || 'N/A'}`,
  };

  try {
    await contactTransporter.sendMail(mailOptions);
    return {message: 'Your message has been sent!', err: ''};
  } catch {
    return {message: '', err: 'Something went wrong. Try again later.'};
  }
}

export async function verifyEmail(email: string, token: string) {
  const mailOptions = {
    from: 'verification@shadowself.io',
    to: email,
    subject: 'Please confirm your email address',
    text: `Please copy and paste the following access token: ${token}`,
  };

  try {
    await verificationTransporter.sendMail(mailOptions);
    return {message: 'Your message has been sent!', err: ''};
  } catch {
    return {message: '', err: 'Something went wrong. Try again later.'};
  }
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}
