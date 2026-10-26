import {issueEmailCode, discardEmailCode} from '@core/states';
import type {EmailCodePurpose} from '@type';
import {contactTransporter, identitySmtpTransporter, verificationTransporter} from '@core/services';
import type {ContactDetail, EmailContent, MailSubmissionResult, MailSubmissionClaim} from '@type';
import {createHash, randomUUID} from 'node:crypto';
import {sql} from '@core/services';
import {ApiError} from '@core/security';
import {emailConfig} from '@core/config';
import {EMAIL_TEMPLATES, EMAIL_OUTBOUND_HOURLY_LIMIT} from '@core/constants';

export async function contact(body: ContactDetail) {
  const mailOptions = {
    from: emailConfig.contactAddress,
    to: emailConfig.contactAddress,
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
    from: emailConfig.verificationAddress,
    replyTo: emailConfig.contactAddress,
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

async function sendIdentityEmail(emailContent: EmailContent) {
  const {
    email,
    password,
    to,
    subject,
    body,
    attachments,
    inReplyTo,
    references,
    type,
    messageID,
    date = new Date(),
  } = emailContent;
  const transporter = identitySmtpTransporter(email, password);

  const isHtml = type === 'html';

  const attachmentsList = (attachments || []).map((attachment) => {
    return {
      filename: attachment.filename,
      contentType: attachment.contentType,
      cid: attachment.cid,
      content: attachment.data,
      encoding: 'base64',
    };
  });

  const mailOptions = {
    messageId: messageID,
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

  if (!message.accepted?.length || message.rejected?.length) {
    throw new Error('SMTP acceptance could not be confirmed');
  }

  return {messageID: message.messageId as string, date, type};
}

function verificationEmail(token: string, reason: keyof typeof EMAIL_TEMPLATES) {
  const template = EMAIL_TEMPLATES[reason];
  const subject = `ShadowSelf: ${template.title}`;
  const code = token.replace(
    /[&<>"']/g,
    (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[character]!,
  );
  const expiry = 'This code expires in ten minutes and can be used once. Never share it with anyone.';
  const text = `${template.title}\n\n${template.description}\n\n${token}\n\n${expiry}\n\n${template.notice}\n\nShadowSelf\n${emailConfig.contactAddress}`;
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
Need help? <a href="mailto:${emailConfig.contactAddress}" style="color:#5140a5;">${emailConfig.contactAddress}</a>
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

export function createIdentitySender(dependencies: {
  claim: (identity: string, request: string, fingerprint: string, messageID: string) => Promise<MailSubmissionClaim>;
  complete: (identity: string, request: string, response: MailSubmissionResult) => Promise<void>;
  send: typeof sendIdentityEmail;
}) {
  return async (identity: string, request: string, content: EmailContent) => {
    const {email, to, subject, body, type, inReplyTo = '', references = []} = content;
    const attachments = (content.attachments || []).map(({filename, data, contentType, cid}) => ({
      filename,
      data,
      contentType,
      cid,
    }));
    const payload = {email, to, subject, body, type, inReplyTo, references, attachments};
    const fingerprint = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const proposedID = `<${randomUUID()}@${content.email.split('@')[1]}>`;
    const claim = await dependencies.claim(identity, request, fingerprint, proposedID);

    if (!claim.created) {
      return {...(claim.response || {status: 'uncertain' as const}), replay: true};
    }

    try {
      const sent = await dependencies.send({...content, messageID: claim.messageID});
      const response = {status: 'sent' as const, ...sent};

      await dependencies.complete(identity, request, response);

      return {...response, replay: false};
    } catch {
      return {status: 'uncertain' as const, replay: false};
    }
  };
}

export function createSubmissionStore(database = sql) {
  return {
    async claim(
      identity: string,
      request: string,
      fingerprint: string,
      messageID: string,
    ): Promise<MailSubmissionClaim> {
      return database.begin(async (connection) => {
        await connection`SELECT pg_advisory_xact_lock(hashtext(${`mail:${identity}`}))`;

        const existing =
          await connection`SELECT * FROM mail_submissions WHERE identity_id = ${identity} AND request_id = ${request}`;

        if (existing.length) {
          if (existing[0].payload_hash !== fingerprint) {
            throw new ApiError(409, 'request_conflict', 'This send request has different content');
          }

          return {created: false, messageID: existing[0].message_id, response: existing[0].response};
        }

        const recent =
          await connection`SELECT COUNT(*)::integer AS count FROM mail_submissions WHERE identity_id = ${identity} AND created_at > NOW() - INTERVAL '1 hour'`;

        if (recent[0].count >= EMAIL_OUTBOUND_HOURLY_LIMIT) {
          throw new ApiError(429, 'mail_rate_limit', 'Hourly outbound email limit reached');
        }

        await connection`INSERT INTO mail_submissions (identity_id, request_id, payload_hash, message_id) VALUES (${identity}, ${request}, ${fingerprint}, ${messageID})`;

        return {created: true, messageID};
      });
    },
    async complete(identity: string, request: string, response: MailSubmissionResult) {
      await database`UPDATE mail_submissions SET response = ${database.json(response)} WHERE identity_id = ${identity} AND request_id = ${request}`;
    },
  };
}

export const submitIdentityEmail = createIdentitySender({...createSubmissionStore(), send: sendIdentityEmail});
