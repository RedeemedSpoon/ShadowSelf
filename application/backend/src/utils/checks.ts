import type {BodyField, ContactDetail, CheckIdentity, APIRequest} from '@types';
import {toTitleCase} from '@utils/utils';
import {$} from 'bun';

const ethnicities = ['caucasian', 'black', 'hispanic', 'slav', 'arab', 'east asian', 'south asian'];

export function check(rawBody: unknown, fields: string[], ignore?: boolean): BodyField {
  const body = rawBody as BodyField;

  for (const field of fields) {
    const isOptional = field.startsWith('?');
    const fieldType = isOptional ? field.slice(1) : field;

    if (!Object.prototype.hasOwnProperty.call(body, field) && !isOptional) {
      return {err: `${toTitleCase(field)} is a required field`} as BodyField;
    }

    if (ignore) continue;
    if (isOptional && !body[fieldType as keyof BodyField]) continue;

    switch (fieldType) {
      case 'username':
        if (!/^[\p{L}\p{N}\s]+$/u.test(body.username)) {
          return {err: 'Username can only contain letters, numbers and spaces'} as BodyField;
        } else if (body.username.length > 25) {
          return {err: 'Username is too long (<25 characters)'} as BodyField;
        }
        break;

      case 'password':
        if (!/^(?=.*?[a-z])(?=.*?[0-9]).{8,}$/.test(body.password)) {
          return {err: 'Password is too weak. Improve it a bit'} as BodyField;
        }
        break;

      case 'email':
        if (!/^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/gm.test(body.email)) {
          return {err: 'Invalid email address. Please try again'} as BodyField;
        } else if (body.email.length > 48) {
          return {err: 'Email is too long (<48 characters)'} as BodyField;
        }
        break;

      case 'access':
        if (!/^\d+$/.test(body.access)) {
          return {err: 'Invalid access token. Please try again'} as BodyField;
        }
        break;

      case 'secret':
        if (body.secret.length > 32 && !/^[A-Z0-9]+$/.test(body.secret)) {
          return {err: 'OTP secret is invalid. Get a new one'} as BodyField;
        }
        break;

      case 'token':
        if (!/^\d{6}$/.test(body.token)) {
          return {err: 'Validation token must be a 6 digit number'} as BodyField;
        }
        break;

      case 'code':
        if (!/^\d{9}$/.test(body.code)) {
          return {err: 'recovery codes must be a 9 digit number'} as BodyField;
        }
        break;

      case 'recovery':
        if (!Array.isArray(body.recovery) || !body.recovery.every((b) => /^\d{9}$/.test(b))) {
          return {err: 'Wrong recovery codes structure. Generate new ones'} as BodyField;
        }
        break;

      case 'payment':
        if (body.payment.length !== 27 || !body.payment.startsWith('pm_')) {
          return {err: 'Payment method is invalid. Please try again'} as BodyField;
        }
        break;

      case 'intent':
        if (body.intent.length !== 27 || !body.intent.startsWith('pi_')) {
          return {err: 'Payment Intent is invalid. Please try again'} as BodyField;
        }
        break;

      case 'subscription':
        if (body.subscription.length !== 28 || !body.subscription.startsWith('sub_')) {
          return {err: 'Subscription ID is invalid. Please try again'} as BodyField;
        }
        break;

      case 'id':
        if (body.id.length !== 12) {
          return {err: 'Invalid ID, please try again'} as BodyField;
        }
        break;
    }
  }

  return body;
}

export function checkContact(Rawbody: unknown): ContactDetail {
  const body = Rawbody as ContactDetail;

  for (const field of ['category', 'message', 'subject']) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return {err: `${toTitleCase(field)} is a required field`} as ContactDetail;
    }
  }

  if (body.subject.length > 120) {
    return {err: 'Subject is too long (<120 characters)'} as ContactDetail;
  }

  if (!body.message.length) {
    return {err: 'Message is empty'} as ContactDetail;
  }

  if (body.email && !/^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/gm.test(body.email)) {
    return {err: 'Please enter a valid email'} as ContactDetail;
  }

  if (!body.category.match(/^(question|feedback|collaboration|refund|bug|help|other)$/i)) {
    return {err: 'Please enter a valid category'} as ContactDetail;
  }

  return body;
}

export async function checkIdentity(kind: string, body: CheckIdentity): Promise<CheckIdentity> {
  if (!body) return body;

  switch (kind) {
    case 'location':
      if (!['US', 'CA', 'GB', 'SE'].includes(body.location!)) {
        return {error: 'Invalid location code'};
      }
      break;

    case 'identity':
      if (body.name!.trim().length < 2) {
        return {error: 'Name must be at least 2 characters long'};
      }

      if (body.name!.length > 30) {
        return {error: 'Name is too long (<30 characters)'};
      }

      if (!/^[\p{L}\s.'-]+$/u.test(body.name!)) {
        return {error: 'Name contains invalid characters'};
      }

      if (body.sex !== 'male' && body.sex !== 'female') {
        return {error: 'Sex must be either "male" or "female"'};
      }

      if (body.age! < 18 || body.age! > 60) {
        return {error: 'Age must be between 18 and 60'};
      }

      if (!ethnicities.includes(body.ethnicity!)) {
        return {error: 'Ethnicity must be a valid ethnicity'};
      }

      if (body.bio!.trim().length > 0 && body.bio!.trim().length < 5) {
        return {error: 'Biography must be at least 5 characters long if provided'};
      }

      if (body.bio!.length > 126) {
        return {error: 'Biography is too long (<126 characters)'};
      }

      if (!/^[A-Za-z0-9+/=]+$/.test(body.picture!)) {
        return {error: 'Incorrect profile picture format'};
      }
      break;

    case 'email': {
      if (!/^[a-zA-Z0-9_-]+@shadowself\.io$/.test(body.email!)) {
        return {error: 'Invalid email address. Use only letters, numbers, underscores, and hyphens.'};
      }

      if (body.email!.length > 48) {
        return {error: 'Email is too long (<48 characters)'};
      }

      const command = await $`id $EMAIL_ADDRESS`.env({EMAIL_ADDRESS: body.email!}).quiet().nothrow();
      return command.exitCode === 0 ? {error: 'Email address is already registered on our systems'} : body;
    }

    case 'phone':
      if (!/^\+(\d{10,13})$/.test(body.phone!)) {
        return {error: 'Invalid phone number, please try again'};
      }
      break;

    case 'wallet':
      if (!body.wallet || !body.wallet.keys) {
        return {error: 'Missing wallet data'};
      }

      const {blob, keys} = body.wallet;

      if (!blob || blob.length < 20) {
        return {error: 'Invalid wallet encryption blob'};
      }

      if (!/^[a-zA-Z0-9]{100,130}$/.test(keys.btc)) {
        return {error: 'Invalid Bitcoin Extended Public Key'};
      }

      if (!/^[a-zA-Z0-9]{100,130}$/.test(keys.ltc)) {
        return {error: 'Invalid Litecoin Extended Public Key'};
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(keys.evm)) {
        return {error: 'Invalid Ethereum Address'};
      }

      if (!/^[48][a-zA-Z0-9]{90,110}$/.test(keys.xmr?.address)) {
        return {error: 'Invalid Monero Address'};
      }

      if (!/^[a-fA-F0-9]{64}$/.test(keys.xmr?.viewKey)) {
        return {error: 'Invalid Monero View Key'};
      }
      break;

    case 'provision': {
      const validationKinds = ['location', 'identity', 'email', 'phone', 'wallet'];

      for (const validationKind of validationKinds) {
        const {error} = await checkIdentity(validationKind, body);
        if (error) return {error};
      }

      break;
    }
  }

  return body;
}

export async function checkAPI(rawBody: unknown, fields: string[]): Promise<APIRequest> {
  if (!rawBody || typeof rawBody !== 'object') return {err: 'Invalid request body'} as APIRequest;
  const body = rawBody as APIRequest;

  for (const field of fields) {
    const isOptional = field.startsWith('?');
    const fieldType = isOptional ? field.slice(1) : field;

    if (!Object.prototype.hasOwnProperty.call(body, field) && !isOptional) {
      return {err: `${toTitleCase(field)} is a required field`} as APIRequest;
    }

    if (isOptional && !body[fieldType as keyof APIRequest]) continue;

    switch (fieldType) {
      case 'name':
        if (typeof body.name !== 'string') {
          return {err: 'Name must be a string'} as APIRequest;
        }

        if (body.name.trim().length < 2) {
          return {err: 'Name must be at least 2 characters long'} as APIRequest;
        }

        if (/[^\\p{L}\\s.'-]/u.test(body.name)) {
          return {err: 'Name contains invalid characters'} as APIRequest;
        }

        if (body.name.length > 30) {
          return {err: 'Name is too long (<30 characters)'} as APIRequest;
        }
        break;

      case 'bio':
        if (typeof body.bio !== 'string') {
          return {err: 'Biography must be a string'} as APIRequest;
        }

        if (body.bio.trim().length > 0 && body.bio.trim().length < 10) {
          return {err: 'Biography must be at least 10 characters long if provided'} as APIRequest;
        }

        if (body.bio.length > 126) {
          return {err: 'Biography is too long (<126 characters)'} as APIRequest;
        }
        break;

      case 'sex':
        if (body.sex !== 'male' && body.sex !== 'female') {
          return {err: 'Sex must be either "male" or "female"'} as APIRequest;
        }
        break;

      case 'age':
        if (typeof body.age !== 'number' || !Number.isInteger(body.age)) {
          return {err: 'Age must be a whole number'} as APIRequest;
        }

        if (body.age < 18 || body.age > 60) {
          return {err: 'Age must be between 18 and 60'} as APIRequest;
        }
        break;

      case 'ethnicity':
        if (typeof body.ethnicity !== 'string' || !ethnicities.includes(body.ethnicity)) {
          return {err: 'Ethnicity must be a valid ethnicity from the allowed list'} as APIRequest;
        }
        break;

      case 'picture':
        if (typeof body.picture !== 'string') {
          return {err: 'Picture data must be a string'} as APIRequest;
        }

        if (!/^[A-Za-z0-9+/=]+$/.test(body.picture)) {
          return {err: 'Incorrect profile picture format'} as APIRequest;
        }
        break;

      case 'username':
        if (typeof body.username !== 'string') {
          return {err: 'Username must be a string'} as APIRequest;
        }

        if (body.username.length > 25) {
          return {err: 'Username is too long (<25 characters)'} as APIRequest;
        }
        break;

      case 'password':
        if (typeof body.password !== 'string') {
          return {err: 'Password must be a string'} as APIRequest;
        }

        if (!/^(?=.*?[a-z])(?=.*?[0-9]).{8,}$/.test(body.password)) {
          return {err: 'Password is too weak. Minimum 8 chars, requires letters and numbers.'} as APIRequest;
        }
        break;

      case 'website':
        if (typeof body.website !== 'string') {
          return {err: 'Website must be a string'} as APIRequest;
        }

        if (!/^(https?:\/\/)?([a-zA-Z0-9-]+\.)*([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/[^?]*)?(\?[^#]*)?$/.test(body.website)) {
          return {err: 'Invalid website address, please try again'} as APIRequest;
        }
        break;

      case 'totp':
        if (typeof body.totp !== 'string') {
          return {err: 'TOTP secret must be a string'} as APIRequest;
        }

        if (!/^[A-Za-z0-9+/=]+$/.test(body.totp)) {
          return {err: 'Invalid TOTP secret, please try again'} as APIRequest;
        }
        break;

      case 'algorithm':
        if (typeof body.algorithm !== 'string') {
          return {err: 'Algorithm must be a string'} as APIRequest;
        }

        if (!['SHA1', 'SHA256', 'SHA512'].includes(body.algorithm)) {
          return {err: 'Unrecognized algorithm, please try again'} as APIRequest;
        }
        break;

      case 'id':
        if (typeof body.id !== 'number' || !Number.isInteger(body.id) || body.uid < 1) {
          return {err: 'Invalid ID (must be a positive integer), please try again'} as APIRequest;
        }
        break;

      case 'uid':
        if (typeof body.uid !== 'number' || !Number.isInteger(body.uid) || body.uid < 1) {
          return {err: 'Invalid email UID (must be a positive integer), please try again'} as APIRequest;
        }
        break;

      case 'sid':
        if (typeof body.sid !== 'string') {
          return {err: 'Message SID must be a string'} as APIRequest;
        }

        if (body.sid.length !== 34) {
          return {err: 'Invalid message SID, please try again'} as APIRequest;
        }
        break;

      case 'uuid':
        if (typeof body.uuid !== 'string') {
          return {err: 'Email UUID must be a string'} as APIRequest;
        }
        break;

      case 'since':
        if (typeof body.since !== 'string' || !Number.isInteger(Number(body.since)) || Number(body.since) < 1) {
          return {err: 'Invalid since parameter (must be a positive integer), please try again'} as APIRequest;
        }
        break;

      case 'addressee':
        if (typeof body.addressee !== 'string') {
          return {err: 'Addressee must be a string'} as APIRequest;
        }

        if (!/^\+\d{10,15}$/.test(body.addressee)) {
          return {err: 'Invalid phone number format (e.g. +1xxxxxxxxxx), please try again'} as APIRequest;
        }
        break;

      case 'subject':
        if (typeof body.subject !== 'string') {
          return {err: 'Subject must be a string'} as APIRequest;
        }

        if (body.subject.length > 126) {
          return {err: 'Long subject (>126 characters), please try again'} as APIRequest;
        }
        break;

      case 'body':
        if (typeof body.body !== 'string') {
          return {err: 'Body must be a string'} as APIRequest;
        }

        if (body.body.trim().length < 2) {
          return {err: 'Body is too short, please try again'} as APIRequest;
        }
        break;

      case 'mailbox':
        if (typeof body.mailbox !== 'string') {
          return {err: 'Mailbox must be a string'} as APIRequest;
        }

        if (!['INBOX', 'Sent', 'Drafts', 'Junk'].includes(body.mailbox)) {
          return {err: 'Non-existent mailbox, please try again'} as APIRequest;
        }
        break;

      case 'from':
        if (typeof body.from !== 'string') {
          return {err: 'From address must be a string'} as APIRequest;
        }

        if (!/^[\w\-+.%]+@([\w-]+\.)+[\w-]{2,}$/i.test(body.from)) {
          return {err: 'Invalid from email address, please try again'} as APIRequest;
        }

        break;

      case 'to':
        if (typeof body.to !== 'string') {
          return {err: 'To address must be a string'} as APIRequest;
        }

        if (!/^[\w\-+.%]+@([\w-]+\.)+[\w-]{2,}$/i.test(body.to)) {
          return {err: 'Invalid recipient email, please try again'} as APIRequest;
        }
        break;

      case 'forward':
        if (typeof body.forward !== 'string') {
          return {err: 'Forward address must be a string'} as APIRequest;
        }

        if (!/^[\w\-+.%]+@([\w-]+\.)+[\w-]{2,}$/i.test(body.forward)) {
          return {err: 'Invalid forward email, please try again'} as APIRequest;
        }
        break;

      case 'inReplyTo':
        if (typeof body.inReplyTo !== 'string') {
          return {err: 'inReplyTo must be a string'} as APIRequest;
        }

        if (body.inReplyTo && !/<[^<>]+@([^<>.]+\.)+[^<>.]+>/.test(body.inReplyTo)) {
          return {err: 'Invalid inReplyTo value (should be Message-ID format like <id@domain>), please try again'} as APIRequest;
        }
        break;

      case 'references':
        if (!Array.isArray(body.references)) {
          return {err: 'References must be an array'} as APIRequest;
        }

        for (const ref of body.references) {
          if (typeof ref !== 'string' || !/<[^<>]+@([^<>.]+\.)+[^<>.]+>/.test(ref)) {
            return {
              err: 'Invalid reference value found (should be Message-ID format like <id@domain>), please try again',
            } as APIRequest;
          }
        }
        break;

      case 'attachments':
        if (!Array.isArray(body.attachments)) {
          return {err: 'Attachments must be an array'} as APIRequest;
        }

        if (body.attachments.length > 10) {
          return {err: 'Too many attachments (max 10), please try again'} as APIRequest;
        }

        for (const attachment of body.attachments) {
          if (!attachment || typeof attachment !== 'object' || typeof attachment.data !== 'string') {
            return {err: 'Invalid attachment format found (expected object with data string), please try again'} as APIRequest;
          }

          if (attachment.data.length * 0.75 > 15728640) {
            return {err: 'One or more attachments exceed the 15MB size limit, please try again'} as APIRequest;
          }
        }
        break;

      case 'blob':
        if (typeof body.blob !== 'string' || body.blob.length < 20) {
          return {err: 'Invalid wallet encryption blob. Must be a valid encrypted string.'} as APIRequest;
        }
        break;

      case 'btc':
        if (typeof body.btc !== 'string') {
          return {err: 'Bitcoin XPUB must be a string'} as APIRequest;
        }

        if (!/^[xyzXtTuUvV]pub[a-zA-Z0-9]{100,130}$/.test(body.btc)) {
          return {err: 'Invalid Bitcoin Extended Public Key (XPUB)'} as APIRequest;
        }
        break;

      case 'ltc':
        if (typeof body.ltc !== 'string') {
          return {err: 'Litecoin XPUB must be a string'} as APIRequest;
        }

        if (!/^[LMxyzXtTuUvV]pub[a-zA-Z0-9]{100,130}$/.test(body.ltc)) {
          return {err: 'Invalid Litecoin Extended Public Key (XPUB)'} as APIRequest;
        }
        break;

      case 'evm':
        if (typeof body.evm !== 'string') {
          return {err: 'Ethereum address must be a string'} as APIRequest;
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(body.evm)) {
          return {err: 'Invalid Ethereum/EVM Address format'} as APIRequest;
        }
        break;

      case 'xmr_address':
        if (typeof body.xmr_address !== 'string') {
          return {err: 'Monero address must be a string'} as APIRequest;
        }

        if (!/^[48][a-zA-Z0-9]{90,110}$/.test(body.xmr_address)) {
          return {err: 'Invalid Monero Address format'} as APIRequest;
        }
        break;

      case 'xmr_viewkey':
        if (typeof body.xmr_viewkey !== 'string') {
          return {err: 'Monero view key must be a string'} as APIRequest;
        }

        if (!/^[a-fA-F0-9]{64}$/.test(body.xmr_viewkey)) {
          return {err: 'Invalid Monero View Key format (must be 64 hex characters)'} as APIRequest;
        }
        break;
    }
  }

  return body as unknown as APIRequest;
}
