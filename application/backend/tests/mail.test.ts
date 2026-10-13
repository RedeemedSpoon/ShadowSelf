import {describe, expect, test} from 'bun:test';
import type imap from 'imap-simple';
import {createMailReader} from '../src/utils/email-imap';
import type {Mailbox} from '../src/types';

function fixture() {
  let mailbox: Mailbox = 'INBOX';
  const calls: {mailbox: Mailbox; options: Record<string, unknown>}[] = [];
  const reads: number[] = [];
  const downloads: string[] = [];
  const deleted: number[][] = [];
  let closed = 0;
  const text = {partID: '1', type: 'text', subtype: 'plain', encoding: '8BIT', params: {charset: 'utf-8'}};
  const attachment = {partID: '2', type: 'application', subtype: 'octet-stream', disposition: {type: 'ATTACHMENT', params: {filename: 'synthetic.bin'}}};
  const folders = {INBOX: Array.from({length: 25}, (_, index) => index + 1), Sent: [7], Drafts: [], Junk: Array.from({length: 25}, (_, index) => index + 1)};
  const connection = {
    openBox: async (box: Mailbox) => {
      mailbox = box;
    },
    end: () => {
      closed++;
    },
    addFlags: async (uid: number) => {
      reads.push(uid);
    },
    deleteMessage: async (uids: number[]) => {
      deleted.push(uids);
      folders.Junk = folders.Junk.filter((uid) => !uids.includes(uid));
    },
    getPartData: async (_message: unknown, part: typeof text) => {
      downloads.push(part.partID);

      return part.partID === '1' ? `Body from ${mailbox}` : Buffer.from('synthetic file');
    },
    search: async (criteria: unknown[][], options: Record<string, unknown>) => {
      calls.push({mailbox, options});
      const ids = criteria[0][0] === 'UID' ? String(criteria[0][1]).split(',').map(Number) : [7];

      return folders[mailbox]
        .filter((uid) => ids.includes(uid))
        .map((uid) => ({
          attributes: {uid, flags: [], date: new Date('2026-10-01T00:00:00Z'), struct: [text, attachment]},
          parts: [
            {
              which: 'HEADER',
              body: `From: sender@example.test\r\nTo: recipient@example.test\r\nSubject: ${mailbox} ${uid}\r\nMessage-ID: <${mailbox}-${uid}@example.test>\r\n`,
            },
          ],
        }));
    },
    imap: {
      search: (criteria: unknown[][], callback: (error: null, ids: number[]) => void) => {
        callback(null, Array.isArray(criteria[0]) && criteria[0][0] === 'BEFORE' ? [1, 2, 3] : folders[mailbox]);
      },
    },
  };
  const reader = createMailReader(async () => connection as unknown as imap.ImapSimple);

  return {reader, calls, reads, downloads, deleted, closed: () => closed};
}

describe('mail reader', () => {
  test('UID lookup stays in the requested mailbox and retrieves attachments only on demand', async () => {
    const state = fixture();
    const inbox = await state.reader.message('synthetic@example.test', 'synthetic', 'INBOX', 7, false);
    const sent = await state.reader.message('synthetic@example.test', 'synthetic', 'Sent', 7, false);

    expect(inbox?.subject).toBe('INBOX 7');
    expect(sent?.subject).toBe('Sent 7');
    expect(inbox?.attachments[0].data).toBeUndefined();
    expect(state.downloads).toEqual(['1', '1']);
    expect(state.reads).toEqual([]);

    const file = await state.reader.attachment('synthetic@example.test', 'synthetic', 'INBOX', 7, 0);

    expect(file?.data).toBe(Buffer.from('synthetic file').toString('base64'));
    expect(state.downloads).toEqual(['1', '1', '2']);
    expect(state.closed()).toBe(3);
  });

  test('listing returns envelope pages without body downloads or read mutations', async () => {
    const state = fixture();
    const first = await state.reader.list('synthetic@example.test', 'synthetic', 'INBOX');
    const second = await state.reader.list('synthetic@example.test', 'synthetic', 'INBOX', first.nextCursor!);
    const third = await state.reader.list('synthetic@example.test', 'synthetic', 'INBOX', second.nextCursor!);

    expect(first.messages.map((message) => message.uid)).toEqual([25, 24, 23, 22, 21, 20, 19, 18, 17, 16]);
    expect(first.complete).toBe(false);
    expect(third.complete).toBe(true);
    expect(third.messages).toHaveLength(5);
    expect(first.messagesCount).toBe(25);
    expect(state.downloads).toEqual([]);
    expect(state.reads).toEqual([]);
    expect(state.calls.every((call) => call.options.markSeen === false && String(call.options.bodies).startsWith('HEADER.FIELDS'))).toBe(true);
  });

  test('opening marks only that message read and junk cleanup includes messages outside the page', async () => {
    const state = fixture();
    const message = await state.reader.message('synthetic@example.test', 'synthetic', 'INBOX', 7);
    const junk = await state.reader.list('synthetic@example.test', 'synthetic', 'Junk');

    expect(message?.read).toBe(true);
    expect(state.reads).toEqual([7]);
    expect(state.deleted).toEqual([[1, 2, 3]]);
    expect(junk.messagesCount).toBe(22);
    expect(junk.messages.map((email) => email.uid)).not.toContain(1);
  });

  test('missing messages do not download data or change read state', async () => {
    const state = fixture();

    expect(await state.reader.message('synthetic@example.test', 'synthetic', 'Sent', 99)).toBeNull();
    expect(state.reads).toEqual([]);
    expect(state.downloads).toEqual([]);
    expect(state.closed()).toBe(1);
  });

  test('reply lookup uses Message-ID across folders without marking messages read', async () => {
    const state = fixture();
    const message = await state.reader.reply('synthetic@example.test', 'synthetic', '<Sent-7@example.test>');

    expect(message?.mailbox).toBe('Sent');
    expect(message?.messageID).toBe('<Sent-7@example.test>');
    expect(state.reads).toEqual([]);
    expect(state.calls.map((call) => call.mailbox)).toEqual(['INBOX', 'Sent']);
    expect(state.closed()).toBe(1);
  });

  test('forward preparation downloads original attachments without marking the source read', async () => {
    const state = fixture();
    const message = await state.reader.message('synthetic@example.test', 'synthetic', 'INBOX', 7, false, true);

    expect(message?.subject).toBe('INBOX 7');
    expect(message?.attachments[0].data).toBe(Buffer.from('synthetic file').toString('base64'));
    expect(state.downloads).toEqual(['1', '2']);
    expect(state.reads).toEqual([]);
  });
});
