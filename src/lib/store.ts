import {writable} from 'svelte/store';
import type {Writable} from 'svelte/store';
import type {Notification} from '$types';

export const authenticated: Writable<boolean> = writable(false);
export const notification: Writable<Notification> = writable({id: null, message: '', type: 'info'});
