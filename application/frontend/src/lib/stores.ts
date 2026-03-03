import type {Notification, PricingModel, FullIdentity, WebSocketMessage, MoneroData} from '$type';
import {writable, type Writable} from 'svelte/store';
import {allPricingModels} from '$type';

export const user: Writable<string> = writable('');
export const token: Writable<string> = writable('');

export const scrollY: Writable<number> = writable(0);
export const currentStep: Writable<number> = writable(1);
export const stickyYScroll: Writable<number> = writable(0);

export const activeModal: Writable<number> = writable(0);
export const pendingID: Writable<number> = writable(0);

export const identity: Writable<FullIdentity> = writable();
export const moneroData: Writable<MoneroData> = writable();
export const masterPassword: Writable<string> = writable();
export const handleResponse: Writable<(response: WebSocketMessage) => void> = writable(() => {});

export const mobileHamburgerMenu: Writable<boolean> = writable(false);
export const notification: Writable<Notification> = writable({id: null, message: '', type: 'info'});
export const pricingModel: Writable<PricingModel> = writable({name: 'Monthly', ...allPricingModels.monthly});
