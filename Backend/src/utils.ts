import type {ContactDetail, QueryResult} from './types';
import {transporter} from './connection';

export async function attempt(func: Promise<unknown>): Promise<QueryResult[]> {
  try {
    return (await func) as QueryResult[];
  } catch (error) {
    return error as QueryResult[];
  }
}

export async function sendEmail(body: ContactDetail) {
  const mailOptions = {
    from: 'contact@shadowself.io',
    to: 'contact@shadowself.io',
    subject: `${body.category.toUpperCase()}: ` + body.subject,
    text: `${body.message}\n\nEmail: ${body.email || 'N/A'}`,
  };

  try {
    await transporter.sendMail(mailOptions);
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
