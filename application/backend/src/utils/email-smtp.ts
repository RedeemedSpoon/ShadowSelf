import {issueEmailCode, discardEmailCode} from '@core/states';
import type {EmailCodePurpose} from '@type';
import {contactTransporter, identitySmtpTransporter, verificationTransporter} from '@core/services';
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

async function sendOfficialEmail(email: string, token: string, reason: keyof typeof EMAIL_TEMPLATES) {
  const mailOptions = {
    from: 'verification@shadowself.io',
    to: email,
    ...verificationEmail(token, reason),
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
  const transporter = identitySmtpTransporter(email, password);

  const isHtml = /<[a-z][^>]*>/i.test(body);
  const date = new Date();

  const attachmentsList = (attachments || []).map((attachment) => {
    return {
      filename: attachment.filename,
      content: attachment.data.includes(',') ? attachment.data.split(',')[1] : attachment.data,
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

  const message = await transporter.sendMail(mailOptions);

  return {messageID: message?.messageId, date, type: isHtml ? 'html' : 'text'};
}

export function verificationEmail(token: string, reason: keyof typeof EMAIL_TEMPLATES) {
  const template = EMAIL_TEMPLATES[reason];
  const subject = `ShadowSelf: ${template.title}`;
  const code = token.replace(
    /[&<>"']/g,
    (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[character]!,
  );
  const expiry = 'This code expires in ten minutes and can be used once. Never share it with anyone.';
  const text = `${template.title}\n\n${template.description}\n\n${token}\n\n${expiry}\n\n${template.notice}\n\nShadowSelf\ncontact@shadowself.io`;
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${template.title}</title></head>
<body style="margin:0;padding:0;background-color:#eef0f6;font-family:Arial,Helvetica,sans-serif;color:#182033;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef0f6">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;border:1px solid #d9deea;" bgcolor="#ffffff">
<tr><td bgcolor="#101629" style="padding:24px 28px;color:#f4f3ff;font-size:22px;font-weight:bold;">ShadowSelf</td></tr>
<tr><td style="padding:28px;">
<h1 style="margin:0 0 20px;font-size:24px;line-height:32px;color:#182033;">${template.title}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:25px;">${template.description}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0edff">
<tr><td align="center" style="padding:22px 12px;border:1px solid #d9d1ff;color:#403080;font-family:Consolas,monospace;font-size:28px;font-weight:bold;letter-spacing:4px;word-break:break-all;">${code}</td></tr>
</table>
<p style="margin:24px 0 16px;font-size:14px;line-height:23px;color:#4d566c;">${expiry}</p>
<p style="margin:0;font-size:14px;line-height:23px;color:#4d566c;">${template.notice}</p>
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #e3e6ef;font-size:13px;line-height:22px;color:#5d667c;">
Need help? <a href="mailto:contact@shadowself.io" style="color:#5140a5;">contact@shadowself.io</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return {subject, text, html};
}

export async function sendVerificationCode(purpose: EmailCodePurpose, email: string, binding: string) {
  const issued = issueEmailCode(purpose, email, binding);

  if (issued.status === 429) {
    return {status: 429, message: 'Too many email requests. Wait before trying again'};
  }

  if (issued.status !== 200) {
    return {status: 503, message: 'Verification is busy. Please try again later'};
  }

  const response = await sendOfficialEmail(email, issued.code, purpose);

  if (!response.err) {
    return {status: 200, message: ''};
  }

  discardEmailCode(purpose, email, binding, issued.code);

  return {status: 503, message: 'Verification email delivery is unavailable. Try again later'};
}
