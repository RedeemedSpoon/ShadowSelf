import {env} from '$env/dynamic/public';
import type {PageServerLoad} from './$types';

export const load: PageServerLoad = () => ({stripeKey: env.PUBLIC_STRIPE_KEY || '', requestID: crypto.randomUUID()});
