import {mount, unmount, tick} from 'svelte';
import {get} from 'svelte/store';
import Mail from '../src/lib/components/console/Mail.svelte';
import Phone from '../src/lib/components/console/Phone.svelte';
import Wallet from '../src/lib/components/console/Wallet.svelte';
import Vault from '../src/lib/components/console/Vault.svelte';
import {vaultKey} from '../src/lib/stores';
import type {FullIdentity} from '../src/lib/types';

const account = {
  id: 'abc123def456',
  email: 'synthetic@example.test',
  phone: '+12025550123',
  creationDate: '2026-10-01T00:00:00Z',
} as FullIdentity;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function settle() {
  await tick();
  await new Promise((resolve) => setTimeout(resolve, 30));
}

export async function runConsoleStateRegressions() {
  const originalFetch = window.fetch;
  const originalKey = get(vaultKey);
  const target = document.createElement('div');
  const results: string[] = [];
  let respond: ((response: Response) => void) | undefined;
  let component: ReturnType<typeof mount> | undefined;
  document.body.append(target);

  try {
    const key = await crypto.subtle.generateKey({name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']);
    vaultKey.set(key);

    const cases = [
      {
        Component: Mail,
        label: 'Loading mailbox',
        response: {mailbox: 'INBOX', messages: [], complete: true, nextCursor: null},
        empty: 'No messages in INBOX',
      },
      {
        Component: Phone,
        label: 'Loading conversations',
        response: {messages: [], complete: true, nextCursor: null},
        empty: 'No conversations yet',
      },
      {
        Component: Vault,
        label: 'Loading vault',
        response: {accounts: [], vaultRevision: 1},
        empty: 'No accounts saved',
      },
    ];

    for (const sample of cases) {
      window.fetch = (() =>
        new Promise<Response>((resolve) => {
          respond = resolve;
        })) as unknown as typeof fetch;
      component = mount(sample.Component as typeof Mail, {
        target,
        props: {account, onupdate: () => {}, onunlock: () => {}},
      });
      await settle();

      assert(
        target.textContent?.includes(sample.label),
        `${sample.label} must be visible while the request is pending`,
      );
      assert(target.querySelector('[aria-busy="true"]'), 'Loading state must be accessible');
      assert(respond, 'Expected a pending component request');
      respond(new Response(JSON.stringify(sample.response), {headers: {'Content-Type': 'application/json'}}));
      await settle();

      assert(target.textContent?.includes(sample.empty), `Missing empty state: ${sample.empty}`);
      results.push(sample.empty);
      await unmount(component);
      component = undefined;
      target.replaceChildren();
    }

    window.fetch = (() =>
      new Promise<Response>((resolve) => {
        respond = resolve;
      })) as unknown as typeof fetch;
    component = mount(Wallet, {target, props: {account, onunlock: () => {}}});
    await settle();
    assert(target.textContent?.includes('Loading wallet balances'), 'Wallet must show initial loading');
    assert(respond, 'Expected a pending wallet request');
    respond(
      new Response(JSON.stringify({error: {code: 'provider_unavailable', message: 'Synthetic provider unavailable'}}), {
        status: 503,
        headers: {'Content-Type': 'application/json'},
      }),
    );
    await settle();

    assert(target.textContent?.includes('Synthetic provider unavailable'), 'Wallet failure must be visible');
    assert(target.textContent?.includes('Refresh'), 'Wallet failure must retain a retry action');
    results.push('wallet loading and provider failure');
  } finally {
    if (component) {
      await unmount(component);
    }

    vaultKey.set(originalKey);
    window.fetch = originalFetch;
    target.remove();
  }

  return results;
}
