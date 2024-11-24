import type {Notification, PricingModel} from '$types';
import {writable, type Writable} from 'svelte/store';
import {allPricingModel} from '$types';

export const user: Writable<string> = writable('');
export const token: Writable<string> = writable('');
export const currentStep: Writable<number> = writable(1);

export const scrollY: Writable<number> = writable(0);
export const scrollYProgress: Writable<number> = writable(0);

export const selectionMenuOpen: Writable<boolean> = writable(false);
export const selectionInputOpen: Writable<boolean> = writable(false);

export const notification: Writable<Notification> = writable({id: null, message: '', type: 'info'});
export const pricingModel: Writable<PricingModel> = writable({name: 'Monthly', ...allPricingModel.monthly});
