import {dbConfig, emailConfig, stripeConfig, twilioConfig} from '@core/config';
import {decryptSecret, requireProvider} from '@core/security';
import nodemailer from 'nodemailer';
import twilioClient from 'twilio';
import postgres from 'postgres';
import imap from 'imap-simple';
import Stripe from 'stripe';

function lazyClient<T extends object>(factory: () => T): T {
  let instance: T | undefined;

  return new Proxy({} as T, {
    get(_target, property) {
      instance ||= factory();

      const value = Reflect.get(instance, property);

      return typeof value === 'function' ? value.bind(instance) : value;
    },
  });
}

export const stripe = lazyClient(() => {
  requireProvider(!!stripeConfig.secretKey, 'Card billing');

  return new Stripe(stripeConfig.secretKey, {timeout: 15_000, maxNetworkRetries: 2});
});

let phoneClient: ReturnType<typeof twilioClient> | undefined;

export function getPhoneClient() {
  requireProvider(!!twilioConfig.sid && !!twilioConfig.token, 'Phone service');
  phoneClient ||= twilioClient(twilioConfig.sid, twilioConfig.token, {timeout: 15_000, autoRetry: false});

  return phoneClient;
}

export const sql = postgres({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.dbName,
  username: dbConfig.username,
  password: dbConfig.password,
  max: 10,
  connect_timeout: 10,
  idle_timeout: 30,
});

function smtpTransporter(user: string, pass: string) {
  requireProvider(!!pass && !!emailConfig.host, 'Email delivery');

  return nodemailer.createTransport({
    host: emailConfig.host,
    port: 465,
    secure: true,
    auth: {user, pass},
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
}

export function identitySmtpTransporter(user: string, encryptedPassword: string) {
  return smtpTransporter(user, decryptSecret(encryptedPassword));
}

export async function imapConnection(user: string, password: string, onmail = (_: number) => {}) {
  requireProvider(!!password && !!emailConfig.host, 'Mailbox access');

  return await imap.connect({
    imap: {
      user,
      password: decryptSecret(password),
      host: emailConfig.host,
      port: 993,
      tls: true,
      authTimeout: 15_000,
      connTimeout: 15_000,
    },
    onmail,
  });
}

export const contactTransporter = lazyClient(() => smtpTransporter('contact@shadowself.io', emailConfig.contactPassword));
export const verificationTransporter = lazyClient(() => smtpTransporter('verification@shadowself.io', emailConfig.verificationPassword));
