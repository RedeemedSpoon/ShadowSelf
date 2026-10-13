import {getPhoneClient} from '@core/services';
import {origin, twilioConfig} from '@core/config';
import {parseMessage} from '@utils/utils';
import {ApiError} from '@core/security';
import type {Message} from '@type';

type PhoneClient = ReturnType<typeof getPhoneClient>;

function createPhoneProvider(client: () => PhoneClient = getPhoneClient) {
  async function conversation(phone: string, contact?: string) {
    const [sent, received] = await Promise.all([
      client().messages.list({from: phone, ...(contact ? {to: contact} : {}), limit: 1000}),
      client().messages.list({to: phone, ...(contact ? {from: contact} : {}), limit: 1000}),
    ]);

    return [...sent, ...received].map(parseMessage).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  return {
    conversation,
    async conversations(phone: string) {
      const latest = new Map<string, Message>();

      for (const message of await conversation(phone)) {
        const contact = message.from === phone ? message.to : message.from;

        if (!latest.has(contact)) {
          latest.set(contact, message);
        }
      }

      return [...latest.values()];
    },
    async send(phone: string, to: string, body: string) {
      const message = await client().messages.create({body, messagingServiceSid: twilioConfig.messagingService || undefined, from: phone, to});

      return parseMessage(message);
    },
    async removeConversation(phone: string, contact: string) {
      const messages = await conversation(phone, contact);

      for (const message of messages) {
        await client().messages(message.messageID).remove();
      }
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
