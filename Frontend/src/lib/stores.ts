import type {Notification, PricingModel, Sections, WebSocketResponse} from '$type';
import {writable, type Writable} from 'svelte/store';
import {allPricingModels} from '$type';

export const user: Writable<string> = writable('');
export const token: Writable<string> = writable('');

export const sortAsc: Writable<boolean> = writable(true);
export const filterOverflow: Writable<boolean> = writable(false);
export const currentSection = writable<Sections>('info');

export const scrollY: Writable<number> = writable(0);
export const currentStep: Writable<number> = writable(1);
export const scrollYProgress: Writable<number> = writable(0);

export const showModal: Writable<number> = writable(0);
export const fetching: Writable<number> = writable(0);

export const selectionMenuOpen: Writable<boolean> = writable(false);
export const selectionInputOpen: Writable<boolean> = writable(false);

export const handleResponse: Writable<(response: WebSocketResponse) => void> = writable(() => {});
export const notification: Writable<Notification> = writable({id: null, message: '', type: 'info'});
export const pricingModel: Writable<PricingModel> = writable({name: 'Monthly', ...allPricingModels.monthly});
