import {EMAIL_CONNECTION_LIMIT, EMAIL_MAILBOX_CONNECTION_LIMIT} from '@core/constants';
import {dbConfig, emailConfig, stripeConfig} from '@core/config';
import {ApiError, decryptSecret, requireProvider} from '@core/security';
import nodemailer from 'nodemailer';
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
  if (!stripeConfig.secretKey) {
    throw new ApiError(503, 'provider_unavailable', 'Could not start card billing. Try again');
  }

  return new Stripe(stripeConfig.secretKey, {timeout: 15_000, maxNetworkRetries: 2});
});

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
    port: 587,
    secure: false,
    requireTLS: true,
    tls: {minVersion: 'TLSv1.2'},
    auth: {user, pass},
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
}

export function identitySmtpTransporter(user: string, encryptedPassword: string) {
  return smtpTransporter(user, decryptSecret(encryptedPassword));
}

const mailboxConnections = new Map<string, number>();
let imapConnections = 0;

export async function imapConnection(user: string, password: string, onmail = (_: number) => {}) {
  requireProvider(!!password && !!emailConfig.host, 'Mailbox access');

  const active = mailboxConnections.get(user) || 0;

  if (imapConnections >= EMAIL_CONNECTION_LIMIT || active >= EMAIL_MAILBOX_CONNECTION_LIMIT) {
    throw new ApiError(
      429,
      'mailbox_capacity',
      'Mailbox connection limit reached. Close extra tabs or try again shortly',
    );
  }

  imapConnections++;
  mailboxConnections.set(user, active + 1);
  let released = false;

  const release = () => {
    if (released) {
      return;
    }

    released = true;
    imapConnections--;
    const remaining = (mailboxConnections.get(user) || 1) - 1;

    if (remaining) {
      mailboxConnections.set(user, remaining);
    } else {
      mailboxConnections.delete(user);
    }
  };

  try {
    const connection = await imap.connect({
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
    const end = connection.end.bind(connection);
    connection.end = () => {
      release();
      end();
    };
    connection.once('end', release);
    connection.once('error', release);

    return connection;
  } catch (failure) {
    release();
    throw failure;
  }
}

export const contactTransporter = lazyClient(() =>
  smtpTransporter(emailConfig.contactAddress, emailConfig.contactPassword),
);
export const verificationTransporter = lazyClient(() =>
  smtpTransporter(emailConfig.verificationAddress, emailConfig.verificationPassword),
);

export const billingTransporter = lazyClient(() =>
  smtpTransporter(emailConfig.billingAddress, emailConfig.billingPassword),
);
