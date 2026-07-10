import {dbConfig, emailConfig, inProduction, stripeConfig, twilioConfig} from '@core/config';
import nodemailer from 'nodemailer';
import twilioClient from 'twilio';
import postgres from 'postgres';
import imap from 'imap-simple';
import Stripe from 'stripe';

export const stripe = new Stripe(stripeConfig.secretKey, {apiVersion: '2026-02-25.clover'});
export const twilio = twilioClient(twilioConfig.sid, twilioConfig.token);

export const sql = postgres({
  host: inProduction ? 'postgres' : 'localhost',
  port: 5432,
  database: dbConfig.dbName,
  username: dbConfig.username,
  password: dbConfig.password,
});

export async function ensureDatabaseSchema() {
  await sql`
    CREATE INDEX IF NOT EXISTS crypto_invoices_payable_renewal_idx
    ON crypto_invoices ("owner", "plan", "renewal_id")
    WHERE "renewal_id" IS NOT NULL
      AND "status" IN ('pending', 'confirming', 'underpaid')
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS identities_crypto_invoice_idx
    ON identities ("crypto_invoice")
    WHERE "crypto_invoice" IS NOT NULL
  `;
}

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
