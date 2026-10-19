import {existsSync, readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const environment = path.join(directory, '.env');
const settings = {...(existsSync(environment) ? parseEnv(readFileSync(environment, 'utf8')) : {}), ...process.env};

export const deployment = settings;

const publicSettings = {
  APP_ORIGIN: settings.APP_ORIGIN || 'http://localhost:5000',
  ONION_ORIGIN: settings.ONION_ORIGIN || '',
  MAIL_DOMAIN: settings.MAIL_DOMAIN || 'example.test',
};

for (const [key, value] of Object.entries(publicSettings)) {
  process.env[`PUBLIC_${key}`] = value;
}
