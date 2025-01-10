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
    html: getEmailTemplate(token),
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

function getEmailTemplate(token: string): string {
  return `
  <html>
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="Confirm your email address for account activation.">
      <meta name="author" content="Shadowself.io">
      <title>Confirm Your Email Address</title>
    </head>
    <body>
      <h1>Confirm Your Email Address</h1>
      <p>Please Copy and paste the following access token to verify your email address</p>
      <button>${token}</button>
    </body>
  </html>
  `;
}
