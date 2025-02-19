import nodemailer from 'nodemailer';
import postgres from 'postgres';
import Stripe from 'stripe';
import twilio from 'twilio';

export const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_USER_PWD,
});

export const contactTransporter = nodemailer.createTransport({
  host: 'mail.shadowself.io',
  port: 465,
  secure: true,
  auth: {
    user: 'contact@shadowself.io',
    pass: process.env.EMAIL_CONTACT,
  },
});

export const verificationTransporter = nodemailer.createTransport({
  host: 'mail.shadowself.io',
  port: 465,
  secure: true,
  auth: {
    user: 'verification@shadowself.io',
    pass: process.env.EMAIL_VERIFICATION,
  },
});

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-11-20.acacia; custom_checkout_beta=v1' as '2024-12-18.acacia',
});

export const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
