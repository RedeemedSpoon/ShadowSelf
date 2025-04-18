import type {Notification, PricingModel, Sections, FullIdentity, WebSocketMessage} from '$type';
import {writable, type Writable} from 'svelte/store';
import {allPricingModels} from '$type';

export const user: Writable<string> = writable('');
export const token: Writable<string> = writable('');

export const sortAsc: Writable<boolean> = writable(true);
export const filterOverflow: Writable<boolean> = writable(false);
export const currentSection: Writable<Sections> = writable('info');

export const scrollY: Writable<number> = writable(0);
export const currentStep: Writable<number> = writable(1);
export const scrollYProgress: Writable<number> = writable(0);
export const scrollUsingTab: Writable<boolean> = writable(false);

export const modalIndex: Writable<number> = writable(0);
export const fetchIndex: Writable<number> = writable(0);

export const identity: Writable<FullIdentity> = writable();
export const masterPassword: Writable<string> = writable();
export const handleResponse: Writable<(response: WebSocketMessage) => void> = writable(() => {});

export const selectionMenuOpen: Writable<boolean> = writable(false);
export const notification: Writable<Notification> = writable({id: null, message: '', type: 'info'});
export const pricingModel: Writable<PricingModel> = writable({name: 'Monthly', ...allPricingModels.monthly});
