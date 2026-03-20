import {DebounceCacheRequests, WSConnection, Location} from '@types';

export const origin = process.env.NODE_ENV === 'dev' ? 'https://localhost' : 'https://shadowself.io';
export const production = process.env.NODE_ENV === 'prod';

export const WSConnections: WSConnection[] = [];
export const debounceCache: DebounceCacheRequests = {};

export const pricingModal = {
  monthly: process.env.MONTHLY_PRICE_ID,
  annually: process.env.ANNUAL_PRICE_ID,
  lifetime: process.env.LIFETIME_PRICE_ID,
};

export const pricingTable = {
  monthly: 500,
  annually: 5000,
  lifetime: 20000,
};

export const locations: Location[] = [
  {
    country: 'United States',
    code: 'US',
    city: 'Seattle',
    localization: 'en_US',
    ip: '91.240.75.212',
    map: 'https://osm.org/go/WIXvEZp-',
  },
  {
    country: 'Canada',
    code: 'CA',
    city: 'Toronto',
    localization: 'en_CA',
    ip: '24.68.162.126',
    map: 'https://osm.org/go/ZX6E86v-',
  },
  {
    country: 'United Kingdom',
    code: 'GB',
    city: 'London',
    localization: 'en_GB',
    ip: '153.869.12.56',
    map: 'https://osm.org/go/euunRP',
  },
];
