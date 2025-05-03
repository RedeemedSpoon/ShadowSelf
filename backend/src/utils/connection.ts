import {WSConnection} from '@types';
import nodemailer from 'nodemailer';
import twilioClient from 'twilio';
import postgres from 'postgres';
import imap from 'imap-simple';
import Stripe from 'stripe';

export const WSConnections: WSConnection[] = [];

export const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_USER_PWD,
});

export function smtpTransporter(user: string, pass: string) {
  return nodemailer.createTransport({
    host: 'mail.shadowself.io',
    port: 465,
    secure: true,
    auth: {user, pass},
  });
}

export async function imapConnection(user: string, password: string, onmail = (_: number) => {}) {
  const config = {
    imap: {
      user,
      password,
      host: 'mail.shadowself.io',
      port: 993,
      tls: true,
    },
    onmail,
  };

  return await imap.connect(config);
}

export const contactTransporter = smtpTransporter('contact@shadowself.io', process.env.EMAIL_CONTACT!);

export const verificationTransporter = smtpTransporter('verification@shadowself.io', process.env.EMAIL_VERIFICATION!);

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {apiVersion: '2025-02-24.acacia' as '2025-03-31.basil'});

export const twilio = twilioClient(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

export const origin = process.env.NODE_ENV === 'dev' ? 'https://localhost' : 'https://shadowself.io';
