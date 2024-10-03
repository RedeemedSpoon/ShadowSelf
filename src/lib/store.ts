import {writable} from 'svelte/store';
import type {Writable} from 'svelte/store';
import type {Notification} from '$types';

export const auth: Writable<boolean> = writable(false);
export const notification: Writable<Notification> = writable({active: false, message: '', type: 'info'});
