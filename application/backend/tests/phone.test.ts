import {describe, expect, test} from 'bun:test';
import {createPhoneProvider} from '../src/core/phone-provider';
import {SMS_PAGE_SIZE, SMS_DELETE_CONCURRENCY} from '../src/core/constants';
import type {getPhoneClient} from '../src/core/services';

function fixture(total = 95, fail?: string) {
  const phone = '+12025550123';
  const contact = '+12025550124';
  let messages = Array.from({length: total}, (_, index) => ({
    sid: `SM${String(index).padStart(32, '0')}`,
    from: index % 2 ? phone : contact,
    to: index % 2 ? contact : phone,
    dateSent: new Date(Date.UTC(2026, 9, 1, 0, index)),
    status: 'delivered',
    body: `Synthetic ${index}`,
    errorCode: null,
  })).reverse();
  const requests: Record<string, unknown>[] = [];
  let active = 0;
  let maximum = 0;
  const directory = Object.assign(
    (sid: string) => ({
      remove: async () => {
        active++;
        maximum = Math.max(maximum, active);
        await new Promise((resolve) => setTimeout(resolve, 1));
        active--;

        if (sid === fail) {
          throw new Error('Synthetic provider failure');
        }

        messages = messages.filter((message) => message.sid !== sid);

        return true;
      },
    }),
    {
      page: async (options: {from: string; to?: string; pageToken?: string; pageSize: number}) => {
        requests.push(options);
        const filtered = messages.filter((message) => (!options.from || message.from === options.from) && (!options.to || message.to === options.to));
        const start = Number(options.pageToken || 0);
        const instances = filtered.slice(start, start + options.pageSize);
        const nextPageUrl = start + options.pageSize < filtered.length ? `https://api.twilio.com/synthetic?PageToken=${start + options.pageSize}` : undefined;

        return {instances, nextPageUrl};
      },
    },
  );
  const provider = createPhoneProvider(() => ({messages: directory}) as unknown as ReturnType<typeof getPhoneClient>);

  return {provider, phone, contact, requests, remaining: () => messages.length, maximum: () => maximum};
}

describe('phone provider', () => {
  test('pages are bounded and explicitly report completeness', async () => {
    const state = fixture();
    const first = await state.provider.conversation(state.phone, state.contact);
    const second = await state.provider.conversation(state.phone, state.contact, first.nextCursor!);

    expect(first.complete).toBe(false);
    expect(first.messages).toHaveLength(2 * SMS_PAGE_SIZE);
    expect(second.complete).toBe(true);
    expect(second.nextCursor).toBeNull();
    expect([...first.messages, ...second.messages]).toHaveLength(95);
    expect(state.requests.every((request) => request.pageSize === SMS_PAGE_SIZE)).toBe(true);
  });

  test('summaries deduplicate contacts within the loaded page', async () => {
    const state = fixture();
    const page = await state.provider.conversations(state.phone);

    expect(page.messages).toHaveLength(1);
    expect(page.messages[0].body).toBe('Synthetic 94');
    expect(page.complete).toBe(false);
    expect(state.requests).toHaveLength(2);
  });

  test('deletion is bounded, resumable and confirms the mailbox is empty', async () => {
    const state = fixture();
    const first = await state.provider.removeConversation(state.phone, state.contact);

    expect(first.deleted).toBe(2 * SMS_PAGE_SIZE);
    expect(first.complete).toBe(false);
    expect(state.remaining()).toBe(35);

    const second = await state.provider.removeConversation(state.phone, state.contact);

    expect(second.deleted).toBe(35);
    expect(second.complete).toBe(true);
    expect(state.remaining()).toBe(0);
    expect(state.maximum()).toBeLessThanOrEqual(SMS_DELETE_CONCURRENCY);
  });

  test('partial provider failures never claim complete deletion', async () => {
    const state = fixture(8, `SM${'0'.repeat(32)}`);
    const result = await state.provider.removeConversation(state.phone, state.contact);

    expect(result.deleted).toBe(7);
    expect(result.failed).toBe(1);
    expect(result.complete).toBe(false);
    expect(state.remaining()).toBe(1);
  });

  test('invalid cursors fail before provider requests', async () => {
    const state = fixture();

    await expect(state.provider.conversation(state.phone, state.contact, 'invalid')).rejects.toThrow('Invalid message cursor');
    expect(state.requests).toHaveLength(0);
  });
});
