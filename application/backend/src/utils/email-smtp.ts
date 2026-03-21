import {contactTransporter, smtpTransporter, verificationTransporter} from '@core/services';
import type {ContactDetail, EmailContent} from '@type';
import {EMAIL_TEMPLATES} from '@core/constants';

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

export async function sendOfficialEmail(email: string, token: string, reason: keyof typeof EMAIL_TEMPLATES) {
  const mailOptions = {
    from: 'verification@shadowself.io',
    to: email,
    subject: 'Shadowself: Please confirm your email address',
    html: getEmailTemplate(token, reason),
  };

  try {
    await verificationTransporter.sendMail(mailOptions);
    return {message: 'Your message has been sent!', err: ''};
  } catch (_) {
    return {message: '', err: 'Something went wrong. Try again later.'};
  }
}

export async function sendIdentityEmail(emailContent: EmailContent) {
  const {email, password, to, subject, body, attachments, inReplyTo, references} = emailContent;
  const transporter = smtpTransporter(email, password);

  const isHtml = /<\/?(html|body|head|title|div|p|span|a|img)>/.test(body);
  const date = new Date();

  const attachmentsList = attachments.map((attachment) => {
    return {
      filename: attachment.filename,
      content: attachment.data.split(',')[1],
      encoding: 'base64',
    };
  });

  const mailOptions = {
    from: email,
    to,
    subject,
    text: isHtml ? '' : body,
    html: isHtml ? body : '',
    attachments: attachmentsList,
    inReplyTo,
    references,
    date,
  };

  const message = await transporter.sendMail(mailOptions).catch(() => {});
  return {messageID: message?.messageId, date, type: isHtml ? 'html' : 'text'};
}

function getEmailTemplate(token: string, reason: keyof typeof EMAIL_TEMPLATES): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/x-icon" href="https://shadowself.io/favicon.ico" />
    <meta name="description" content="${EMAIL_TEMPLATES[reason].title}" />
    <meta name="author" content="Shadowself" />
    <title>${EMAIL_TEMPLATES[reason].title}</title>
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 640px; margin: auto;">
    <main style="background-color: #e2e8f0; margin: auto; max-width: 512px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
      <section style="text-align: center; padding: 20px 50px; margin: auto; background-color: #0f172a; border-radius: 10px 10px 0 0;">
        <img src="https://shadowself.io/email-logo.png" alt="Shadowself Logo" style="width: 158px;" />
      </section>
      <section style="padding: 15px 30px;">
        <h1>${EMAIL_TEMPLATES[reason].title}</h1>
        <p style="color: #0f172a;">Hi there!</p>
        <p style="color: #0f172a;">${EMAIL_TEMPLATES[reason].description}</p>
        <p style="color: #0f172a;">Please copy the following ${EMAIL_TEMPLATES[reason].type} token : <span style="color: #4338ca;">${token}</span></p>
        <p style="color: #0f172a;">If you did not sign up for Shadowself, please ignore this email. if you keep receiving this email, please contact us here: <a href="mailto:contact@shadowself.io" style="color: #4338ca;">contact@shadowself.io</a></p>
        <p style="color: #0f172a;">Once you have completed this step, you will be able to ${EMAIL_TEMPLATES[reason].action}</p>
        <p style="color: #0f172a;">Best regards,<br />Shadowself</p>
      </section>
    </main>
  </body>
</html>
`;
}
