import {mount, unmount, tick} from 'svelte';
import Mail from '../src/lib/components/console/Mail.svelte';
import Phone from '../src/lib/components/console/Phone.svelte';
import {sanitizeEmailHtml} from '../src/lib/utils/shared';
import type {Email, EmailSummary, FullIdentity, Message} from '../src/lib/types';

const account = {
  id: 'synthetic-messaging',
  email: 'identity@example.test',
  phone: '+12025550123',
} as FullIdentity;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 20));
  await tick();
}

function click(target: HTMLElement, text: string) {
  const button = [...target.querySelectorAll('button')].find((element) => element.textContent?.trim() === text);
  assert(button, `Missing button: ${text}`);
  button.click();
}

function summary(mailbox: EmailSummary['mailbox'], uid: number, subject: string): EmailSummary {
  return {
    mailbox,
    uid,
    subject,
    messageID: `<${mailbox}-${uid}@example.test>`,
    from: 'sender@example.test',
    to: account.email,
    date: '2026-10-01T00:00:00Z',
    read: false,
  };
}

function message(contact: string, body: string): Message {
  return {messageID: body, from: contact, to: account.phone, body, status: 'delivered', date: '2026-10-01T00:00:00Z', error: ''};
}

export async function runMessagingBrowserRegressions(target = document.createElement('div')) {
  const originalFetch = window.fetch;
  const originalParent = target.parentElement;
  const results: string[] = [];
  let component: ReturnType<typeof mount> | undefined;
  let resolveOlder: ((response: Response) => void) | undefined;
  let resolveThread: ((response: Response) => void) | undefined;
  let resolveContact: ((response: Response) => void) | undefined;
  const requests: string[] = [];
  const inbox = summary('INBOX', 7, 'Inbox synthetic');
  const sent = summary('Sent', 7, 'Sent synthetic');
  const email: Email = {
    ...inbox,
    body: '<a href="https://example.test/verify">Verify synthetic link</a><img src="https://example.test/tracker"><script>alert(1)</script>',
    type: 'html',
    attachments: [],
    references: [],
    inReplyTo: '<earlier@example.test>',
  };
  const respond = (body: unknown) => new Response(JSON.stringify(body), {headers: {'Content-Type': 'application/json'}});

  if (!originalParent) {
    document.body.append(target);
  }

  try {
    window.fetch = (async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = new URL(String(input), location.origin);
      requests.push(`${options?.method || 'GET'} ${url.pathname}${url.search}`);

      if (url.pathname.endsWith('/messages')) {
        if (url.searchParams.has('before')) {
          return new Promise<Response>((resolve) => {
            resolveOlder = resolve;
          });
        }

        const box = url.searchParams.get('mailbox');

        return respond({
          mailbox: box,
          messages: [box === 'Sent' ? sent : inbox],
          messagesCount: 2,
          nextCursor: box === 'Sent' ? null : 7,
          complete: box === 'Sent',
        });
      }

      if (url.pathname.endsWith('/message')) {
        return respond({email});
      }

      if (url.pathname.endsWith('/reply')) {
        return new Promise<Response>((resolve) => {
          resolveThread = resolve;
        });
      }

      throw new Error(`Unexpected request ${url}`);
    }) as typeof window.fetch;
    component = mount(Mail, {target, props: {account}});
    await settle();
    assert(requests.length === 1 && requests[0].includes('mailbox=INBOX'), 'Mount must request only the selected mailbox');
    assert(target.querySelector('.mail-row.unread'), 'Envelope must preserve unread state');
    click(target, 'Load earlier messages');
    await settle();
    click(target, 'Sent');
    await settle();
    assert(resolveOlder, 'Older page request must be pending');
    resolveOlder(respond({mailbox: 'INBOX', messages: [summary('INBOX', 1, 'Stale inbox')], messagesCount: 2, nextCursor: null, complete: true}));
    await settle();
    assert(target.textContent?.includes('Sent synthetic') && !target.textContent.includes('Stale inbox'), 'Stale Inbox page must not enter Sent');
    results.push('mailbox pagination race');

    click(target, 'INBOX');
    await settle();
    (target.querySelector('.mail-row') as HTMLButtonElement).click();
    await settle();
    const frame = target.querySelector('iframe');
    assert(frame, 'HTML email must render in an iframe');
    assert(
      frame.sandbox.contains('allow-popups') && frame.sandbox.contains('allow-popups-to-escape-sandbox'),
      'Verification destinations must be allowed to open',
    );
    assert(!frame.sandbox.contains('allow-scripts') && !frame.sandbox.contains('allow-same-origin'), 'Message document must remain isolated');
    const sanitized = new DOMParser().parseFromString(frame.srcdoc, 'text/html');
    const link = sanitized.querySelector('a');
    assert(
      link?.href === 'https://example.test/verify' && link.target === '_blank' && link.rel.includes('noopener'),
      'Verification link must retain a safe destination',
    );
    assert(!sanitized.querySelector('script') && !sanitized.querySelector('img[src]'), 'Message scripts and tracking images must be blocked');
    results.push('HTML link permissions and isolation');
    click(target, 'Mailbox');
    await settle();
    assert(resolveThread, 'Thread lookup must be pending');
    resolveThread(respond({fetchEmail: {...email, uid: 1, subject: 'Stale thread', inReplyTo: null}}));
    await settle();
    assert(!target.textContent?.includes('Stale thread'), 'Stale thread must not reopen a closed message');
    results.push('thread selection race');
    await unmount(component);
    component = undefined;

    const first = message('+12025550124', 'Contact A');
    const second = message('+12025550125', 'Contact B');
    window.fetch = (async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = new URL(String(input), location.origin);

      if (options?.method === 'DELETE') {
        return respond({deleted: 30, failed: 1, complete: false});
      }

      if (url.pathname.endsWith('/conversations')) {
        return respond({messages: [first, second], nextCursor: null, complete: true});
      }

      if (url.searchParams.get('addressee') === first.from) {
        return new Promise<Response>((resolve) => {
          resolveContact = resolve;
        });
      }

      return respond({messages: [second], nextCursor: null, complete: true});
    }) as typeof window.fetch;
    component = mount(Phone, {target, props: {account}});
    await settle();
    (target.querySelectorAll('.conversation-list button')[0] as HTMLButtonElement).click();
    await settle();
    click(target, 'Conversations');
    await settle();
    (target.querySelectorAll('.conversation-list button')[1] as HTMLButtonElement).click();
    await settle();
    assert(resolveContact, 'First contact request must be pending');
    resolveContact(respond({messages: [first], nextCursor: null, complete: true}));
    await settle();
    assert(
      target.querySelector('.conversation')?.textContent?.includes('Contact B') && !target.querySelector('.conversation')?.textContent?.includes('Contact A'),
      'Stale contact must not contaminate selection',
    );
    results.push('phone selection race');
    click(target, 'Delete conversation');
    await settle();
    click(target, 'Delete next batch');
    await settle();
    assert(target.textContent?.includes('Messages remain') && target.querySelector('dialog[open]'), 'Partial deletion must stay resumable');
    assert(!target.textContent?.includes('Conversation deletion confirmed'), 'Partial deletion must not claim completion');
    results.push('partial deletion recovery');

    const unsafe = new DOMParser().parseFromString(sanitizeEmailHtml('<a href="javascript:alert(1)">Unsafe</a><form><input></form>'), 'text/html');
    assert(!unsafe.querySelector('a[href]') && !unsafe.querySelector('form, input'), 'Unsafe links and forms must be removed');
    results.push('sanitizer unsafe links and forms');

    return results;
  } finally {
    if (component) {
      await unmount(component);
    }

    window.fetch = originalFetch;
    target.replaceChildren();

    if (!originalParent) {
      target.remove();
    }
  }
}
