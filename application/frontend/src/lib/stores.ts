import {browser} from '$app/environment';
import {writable, type Writable, type Updater} from 'svelte/store';
import type {AppNotice, FullIdentity, MoneroData} from '$type';

function clientStore<T>(initial: T): Writable<T> {
  const store = writable(initial);

  function update(updater: Updater<T>) {
    if (!browser) {
      throw new Error('Identity state must only be changed in the browser');
    }

    store.update(updater);
  }

  return {subscribe: store.subscribe, update, set: (value) => update(() => value)};
}

export const identity = clientStore<FullIdentity | null>(null);
export const moneroData = clientStore<MoneroData>({address: '', viewKey: '', spendKey: ''});
export const vaultKey = clientStore<CryptoKey | null>(null);

export const notifications = clientStore<AppNotice[]>([]);
