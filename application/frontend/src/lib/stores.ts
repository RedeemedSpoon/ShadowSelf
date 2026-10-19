import {browser} from '$app/environment';
import {writable, type Writable} from 'svelte/store';
import type {FullIdentity, MoneroData} from '$type';

function clientStore<T>(initial: T): Writable<T> {
  const store = writable(initial);

  function set(value: T) {
    if (!browser) {
      throw new Error('Identity state must only be changed in the browser');
    }

    store.set(value);
  }

  return {
    subscribe: store.subscribe,
    set,
    update: (updater) => {
      if (!browser) {
        throw new Error('Identity state must only be changed in the browser');
      }

      store.update(updater);
    },
  };
}

export const identity = clientStore<FullIdentity | null>(null);
export const moneroData = clientStore<MoneroData>({address: '', viewKey: '', spendKey: ''});
export const vaultKey = clientStore<CryptoKey | null>(null);
