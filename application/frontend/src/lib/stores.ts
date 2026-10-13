import {writable} from 'svelte/store';
import type {FullIdentity, MoneroData} from '$type';

export const identity = writable<FullIdentity>();
export const moneroData = writable<MoneroData>();
export const vaultKey = writable<CryptoKey | null>(null);
