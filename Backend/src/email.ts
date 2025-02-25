import {contactTransporter, verificationTransporter} from './connection';
import {type ContactDetail, emailTemplate} from './types';

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

export async function sendEmail(email: string, token: string, reason: keyof typeof emailTemplate) {
  const mailOptions = {
    from: 'verification@shadowself.io',
    to: email,
    subject: 'Shadowself: Please confirm your email address',
    html: getEmailTemplate(token, reason),
  };

  try {
    await verificationTransporter.sendMail(mailOptions);
    return {message: 'Your message has been sent!', err: ''};
  } catch {
    return {message: '', err: 'Something went wrong. Try again later.'};
  }
}

function getEmailTemplate(token: string, reason: keyof typeof emailTemplate): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/x-icon" href="https://shadowself.io/favicon.ico" />
    <meta name="description" content="${emailTemplate[reason].title}" />
    <meta name="author" content="Shadowself" />
    <title>${emailTemplate[reason].title}</title>
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 640px; margin: auto;">
    <main style="background-color: #e2e8f0; margin: auto; max-width: 512px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
      <section style="text-align: center; padding: 20px 50px; margin: auto; background-color: #0f172a; border-radius: 10px 10px 0 0;">
        <img src="https://shadowself.io/email-logo.png" alt="Shadowself Logo" style="width: 158px;" />
      </section>
      <section style="padding: 15px 30px;">
        <h1>${emailTemplate[reason].title}</h1>
        <p style="color: #0f172a;">Hi there!</p>
        <p style="color: #0f172a;">${emailTemplate[reason].description}</p>
        <p style="color: #0f172a;">Please copy the following ${emailTemplate[reason].type} token : <span style="color: #4338ca;">${token}</span></p>
        <p style="color: #0f172a;">If you did not sign up for Shadowself, please ignore this email. if you keep receiving this email, please contact us here: <a href="mailto:contact@shadowself.io" style="color: #4338ca;">contact@shadowself.io</a></p>
        <p style="color: #0f172a;">Once you have completed this step, you will be able to ${emailTemplate[reason].action}</p>
        <p style="color: #0f172a;">Best regards,<br />Shadowself</p>
      </section>
    </main>
  </body>
</html>
`;
}
