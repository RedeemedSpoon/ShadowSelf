import {EMAIL_ACCESS_CODE_TTL_MS, EMAIL_VERIFICATION_TTL_MS} from '@core/constants';
import {compareHash, createHash, generateEmailAccessCode, generateEmailVerificationToken} from '@utils/cryptography';
import type {EmailCodePurpose, QueryEmailAccessCode} from '@type';
import {sql} from '@core/services';

export async function createEmailCode(email: string, purpose: EmailCodePurpose): Promise<string> {
  const code = generateEmailAccessCode();
  const codeHash = await createHash(code);
  const expiresAt = new Date(Date.now() + EMAIL_ACCESS_CODE_TTL_MS);

  await deleteStaleEmailCodes(email, purpose);
  await sql`
    INSERT INTO email_access_codes (email, purpose, code_hash, expires_at)
    VALUES (${email}, ${purpose}, ${codeHash}, ${expiresAt})
  `;

  return code;
}

export async function consumeEmailCode(email: string, code: string, purpose: EmailCodePurpose): Promise<boolean> {
  const emailCode = await getActiveEmailCode(email, purpose);
  if (!emailCode) return false;

  const isValid = await compareHash(code, emailCode.code_hash);
  if (!isValid) return false;

  await sql`DELETE FROM email_access_codes WHERE id = ${emailCode.id}`;
  return true;
}

export async function createEmailVerification(email: string, code: string, purpose: EmailCodePurpose): Promise<string> {
  const emailCode = await getActiveEmailCode(email, purpose);
  if (!emailCode) return '';

  const isValid = await compareHash(code, emailCode.code_hash);
  if (!isValid) return '';

  const verification = generateEmailVerificationToken();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  await sql`
    UPDATE email_access_codes
    SET consumed_at = NOW(), verification_token = ${verification}, expires_at = ${expiresAt}
    WHERE id = ${emailCode.id}
  `;

  return verification;
}

export async function consumeEmailVerification(email: string, verification: string, purpose: EmailCodePurpose): Promise<boolean> {
  const result = await sql`
    DELETE FROM email_access_codes
    WHERE email = ${email}
      AND purpose = ${purpose}
      AND verification_token = ${verification}
      AND consumed_at IS NOT NULL
      AND expires_at > NOW()
    RETURNING id
  `;

  return result.length > 0;
}

async function deleteStaleEmailCodes(email: string, purpose: EmailCodePurpose): Promise<void> {
  await sql`
    DELETE FROM email_access_codes
    WHERE (email = ${email} AND purpose = ${purpose})
      OR expires_at <= NOW()
  `;
}

async function getActiveEmailCode(email: string, purpose: EmailCodePurpose): Promise<QueryEmailAccessCode | undefined> {
  const result = (await sql`
    SELECT id, code_hash
    FROM email_access_codes
    WHERE email = ${email}
      AND purpose = ${purpose}
      AND consumed_at IS NULL
      AND expires_at > NOW()
    ORDER BY creation_date DESC
    LIMIT 1
  `) as QueryEmailAccessCode[];

  return result[0];
}
