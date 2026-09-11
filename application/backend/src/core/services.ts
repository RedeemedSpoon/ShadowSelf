import {dbConfig, emailConfig, inProduction, stripeConfig, twilioConfig, origin} from '@core/config';
import nodemailer from 'nodemailer';
import twilioClient from 'twilio';
import postgres from 'postgres';
import imap from 'imap-simple';
import Stripe from 'stripe';

export const stripe = new Stripe(stripeConfig.secretKey, {apiVersion: '2026-08-26.dahlia'});
export const twilio = twilioClient(twilioConfig.sid, twilioConfig.token);

export const sql = postgres({
  host: inProduction ? 'postgres' : 'localhost',
  port: 5432,
  database: dbConfig.dbName,
  username: dbConfig.username,
  password: dbConfig.password,
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
  return await imap.connect({
    imap: {
      user,
      password,
      host: 'mail.shadowself.io',
      port: 993,
      tls: true,
    },
    onmail,
  });
}

export const contactTransporter = smtpTransporter('contact@shadowself.io', emailConfig.contactPassword);
export const verificationTransporter = smtpTransporter('verification@shadowself.io', emailConfig.verificationPassword);

export async function createBillingCustomer(email: string, payment?: string) {
  const accounts = await sql`SELECT id, stripe_customer FROM users WHERE email = ${email}`;
  if (!accounts[0]) throw new Error('Account not found');
  if (accounts[0].stripe_customer) return accounts[0].stripe_customer;

  const params = payment ? {email, payment_method: payment, invoice_settings: {default_payment_method: payment}} : {email};
  const customer = await stripe.customers.create(params, {idempotencyKey: `customer:${accounts[0].id}`});
  await sql`UPDATE users SET stripe_customer = ${customer.id} WHERE id = ${accounts[0].id}`;

  return customer.id;
}

export async function billingPortal(email: string) {
  const accounts = await sql`SELECT stripe_customer FROM users WHERE email = ${email}`;
  if (!accounts[0]?.stripe_customer) return {sessionUrl: ''};

  const session = await stripe.billingPortal.sessions.create({customer: accounts[0].stripe_customer, return_url: `${origin}/settings`});

  return {sessionUrl: session.url};
}
