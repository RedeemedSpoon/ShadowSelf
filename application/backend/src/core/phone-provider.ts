import {getPhoneClient} from '@core/services';
import {origin, twilioConfig} from '@core/config';
import {parseMessage} from '@utils/utils';
import {ApiError} from '@core/security';
import {SMS_PAGE_SIZE, SMS_DELETE_CONCURRENCY} from '@core/constants';

type PhoneClient = ReturnType<typeof getPhoneClient>;

type MessageCursor = {sent: string | null; received: string | null};

function decodeCursor(cursor?: string): MessageCursor {
  if (cursor === undefined) {
    return {sent: '', received: ''};
  }

  try {
    if (cursor.length > 8192 || !/^[A-Za-z0-9_-]+$/.test(cursor)) {
      throw new Error();
    }

    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString());

    for (const direction of ['sent', 'received']) {
      if (value[direction] !== null && (typeof value[direction] !== 'string' || value[direction].length > 2048)) {
        throw new Error();
      }
    }

    return {sent: value.sent, received: value.received};
  } catch {
    throw new ApiError(400, 'invalid_cursor', 'Invalid message cursor');
  }
}

export function createPhoneProvider(client: () => PhoneClient = getPhoneClient) {
  async function conversation(phone: string, contact?: string, cursor?: string) {
    const tokens = decodeCursor(cursor);
    const pages = await Promise.all(
      ['sent', 'received'].map(async (direction) => {
        const token = tokens[direction as keyof MessageCursor];

        if (token === null) {
          return {messages: [], token: null};
        }

        const filter = direction === 'sent' ? {from: phone, ...(contact ? {to: contact} : {})} : {to: phone, ...(contact ? {from: contact} : {})};
        const page = await client().messages.page({...filter, pageSize: SMS_PAGE_SIZE, ...(token ? {pageToken: token} : {})});
        const next = page.nextPageUrl ? new URL(page.nextPageUrl).searchParams.get('PageToken') : null;

        if (page.nextPageUrl && !next) {
          throw new ApiError(502, 'invalid_provider_page', 'Message provider returned an invalid cursor');
        }

        return {messages: page.instances.map(parseMessage), token: next};
      }),
    );
    const messages = pages.flatMap((page) => page.messages).sort((a, b) => b.date.getTime() - a.date.getTime());
    const next = {sent: pages[0].token, received: pages[1].token};
    const complete = next.sent === null && next.received === null;

    return {messages, complete, nextCursor: complete ? null : Buffer.from(JSON.stringify(next)).toString('base64url')};
  }

  return {
    conversation,
    async conversations(phone: string, cursor?: string) {
      const page = await conversation(phone, undefined, cursor);
      const latest = new Map<string, (typeof page.messages)[number]>();

      for (const message of page.messages) {
        const contact = message.from === phone ? message.to : message.from;

        if (!latest.has(contact)) {
          latest.set(contact, message);
        }
      }

      return {...page, messages: [...latest.values()]};
    },
    async send(phone: string, to: string, body: string) {
      const message = await client().messages.create({body, messagingServiceSid: twilioConfig.messagingService || undefined, from: phone, to});

      return parseMessage(message);
    },
    async removeConversation(phone: string, contact: string) {
      const page = await conversation(phone, contact);
      const messages = [...new Map(page.messages.map((message) => [message.messageID, message])).values()];
      let deleted = 0;
      let failed = 0;

      for (let offset = 0; offset < messages.length; offset += SMS_DELETE_CONCURRENCY) {
        const results = await Promise.allSettled(
          messages.slice(offset, offset + SMS_DELETE_CONCURRENCY).map((message) => client().messages(message.messageID).remove()),
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            deleted++;
          } else {
            failed++;
          }
        }
      }

      const remaining = await conversation(phone, contact);

      return {deleted, failed, complete: remaining.complete && remaining.messages.length === 0};
    },
    async available(country: string) {
      const directory = client().availablePhoneNumbers(country);
      const numbers = country === 'GB' ? await directory.mobile.list({limit: 20, smsEnabled: true}) : await directory.local.list({limit: 20, smsEnabled: true});

      return numbers.map((number) => number.phoneNumber);
    },
    async provision(phone: string, identityID: string) {
      const existing = await client().incomingPhoneNumbers.list({phoneNumber: phone, limit: 1});

      const friendlyName = `shadowself:${identityID}`;

      if (existing[0] && existing[0].friendlyName !== friendlyName) {
        throw new ApiError(409, 'phone_conflict', 'This phone is already allocated');
      }

      const number = existing[0] || (await client().incomingPhoneNumbers.create({phoneNumber: phone, friendlyName, smsUrl: `${origin}/api/webhooks/twilio`}));

      if (twilioConfig.messagingService) {
        const service = client().messaging.v1.services(twilioConfig.messagingService);
        const members = await service.phoneNumbers.list({limit: 1000});

        if (!members.some((member) => member.sid === number.sid)) {
          await service.phoneNumbers.create({phoneNumberSid: number.sid});
        }
      }

      return number.sid;
    },
    async release(phone: string, identityID: string, sid?: string) {
      const numbers = await client().incomingPhoneNumbers.list({phoneNumber: phone, limit: 1});

      for (const number of numbers) {
        if (number.friendlyName !== `shadowself:${identityID}` || (sid && sid !== number.sid)) {
          throw new Error('Phone ownership changed; cleanup requires review');
        }

        await client().incomingPhoneNumbers(number.sid).remove();
      }
    },
  };
}

export const phoneProvider = createPhoneProvider();
