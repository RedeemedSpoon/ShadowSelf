import nodemailer from 'nodemailer';
import postgres from 'postgres';

const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_USER_PWD,
});

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'contact@shadowself.io',
    pass: process.env.EMAIL_PWD,
  },
});

export {sql, transporter};
