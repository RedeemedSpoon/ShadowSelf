import type {BodyField, ContactDetail, CheckIdentity, APIParams} from './types';
import {toTitleCase} from './utils';
import {$} from 'bun';

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
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/.test(body.access)) {
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
      if (body.name!.length > 30) {
        return {error: 'Name is too long (<30 characters)'};
      }

      if (body.sex !== 'male' && body.sex !== 'female') {
        return {error: 'Sex must be either "male" or "female"'};
      }

      if (body.age! < 18 || body.age! > 60) {
        return {error: 'Age must be between 18 and 60'};
      }

      if (!['caucasian', 'black', 'hispanic', 'latino', 'arab', 'east asian', 'south asian'].includes(body.ethnicity!)) {
        return {error: 'Ethnicity must be a valid ethnicity'};
      }

      if (body.bio!.length > 126) {
        return {error: 'Biography is too long (<126 characters)'};
      }

      if (!/^[A-Za-z0-9+/=]+$/.test(body.picture!)) {
        return {error: 'Incorrect profile picture format'};
      }
      break;

    case 'email':
      if (!/^[\p{L}\p{N}]+@shadowself\.io$/u.test(body.email!)) {
        return {error: 'Invalid email address, please try again'};
      }

      if (body.email!.length > 48) {
        return {error: 'Email is too long (<48 characters)'};
      }

      return (
        (await $`id ${body.email!.split('@')[0]}`
          .quiet()
          .nothrow()
          .then((e) => {
            if (!e.exitCode) return {error: 'Email address is already registered on our systems'};
          })) || body
      );

    case 'phone':
      if (!/^\+(\d{10,13})$/.test(body.phone!)) {
        return {error: 'Invalid phone number, please try again'};
      }
      break;

    case 'card':
      // if (!/^\d{16}$/.test(body.card!)) {
      //   return { error: 'Invalid credit card number, please try again' };
      // }
      break;

    case 'finish': {
      const validationKinds = ['location', 'identity', 'email', 'phone', 'card'];

      for (const validationKind of validationKinds) {
        const {error} = await checkIdentity(validationKind, body);
        if (error) return {error};
      }

      break;
    }
  }

  return body;
}

export async function checkAPI(body: APIParams): Promise<APIParams> {
  if (!body) return body;

  if (body.name && body.name.length > 30) {
    return {error: 'Name is too long (<30 characters)'};
  }

  if (body.bio && body.bio.length > 126) {
    return {error: 'Biography is too long (<126 characters)'};
  }

  if (body.sex && body.sex !== 'male' && body.sex !== 'female') {
    return {error: 'Sex must be either "male" or "female"'};
  }

  if (body.age && (body.age < 18 || body.age > 60)) {
    return {error: 'Age must be between 18 and 60'};
  }

  if (body.ethnicity && !['caucasian', 'black', 'hispanic', 'latino', 'arab', 'east asian', 'south asian'].includes(body.ethnicity)) {
    return {error: 'Ethnicity must be a valid ethnicity'};
  }

  if (body.picture && !/^[A-Za-z0-9+/=]+$/.test(body.picture)) {
    return {error: 'Incorrect profile picture format'};
  }

  if (body.username && body.username.length > 25) {
    return {error: 'Username is too long (<25 characters)'};
  }

  if (body.password && !/^(?=.*?[a-z])(?=.*?[0-9]).{8,}$/.test(body.password)) {
    return {error: 'Password is too weak. You probably did not use a strong key'};
  }

  if (body.website && !/^(https?:\/\/)?([a-zA-Z0-9-]+\.)*([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\/[^?]*)?(\?[^#]*)?$/.test(body.website)) {
    return {error: 'Invalid website address, please try again'};
  }

  if (body.totp && !/^[A-Za-z0-9+/=]+$/.test(body.totp)) {
    return {error: 'Invalid TOTP secret, please try again'};
  }

  if (body.algorithm && !['SHA1', 'SHA256', 'SHA512'].includes(body.algorithm)) {
    return {error: 'Invalid algorithm, please try again'};
  }

  if (body.uid && body.uid !== Number(body.uid)) {
    return {error: 'Invalid email UID, please try again'};
  }

  if (body.mailbox && !['INBOX', 'Sent', 'Drafts', 'Junk'].includes(body.mailbox)) {
    return {error: 'Invalid mailbox, please try again'};
  }

  if (body.from && body.from !== Number(body.from)) {
    return {error: 'Invalid from value, please try again'};
  }

  return body;
}
