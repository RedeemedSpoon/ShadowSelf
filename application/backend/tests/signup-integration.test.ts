import {afterAll, beforeAll, beforeEach, describe, expect, mock, test} from 'bun:test';
import postgres from 'postgres';
import {createTOTP} from '@utils/cryptography';
import {issueEmailCode} from '@core/states';
import {Elysia} from 'elysia';

const databaseUrl = process.env.SHADOWSELF_TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;
const database = databaseUrl ? postgres(databaseUrl, {max: 4, onnotice: () => {}}) : undefined;
const codes = new Map<string, string>();

mock.module('@core/services', () => ({sql: database, contactTransporter: {}, verificationTransporter: {}, identitySmtpTransporter: () => ({})}));

const {createAccountRoutes} = await import('../src/routes/user-account');
const routes = new Elysia().use(
  createAccountRoutes(async (purpose, email, binding) => {
    const response = issueEmailCode(purpose, email, binding);

    if (response.status === 200) {
      codes.set(email, response.code!);
    }

    return {status: response.status, message: 'Synthetic delivery'};
  }),
);

async function request(path: string, body: Record<string, unknown>) {
  const response = await routes.handle(
    new Request(`http://localhost/api/auth/registration${path}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    }),
  );

  return {status: response.status, body: await response.json()};
}

suite('signup API and session transaction', () => {
  beforeAll(async () => {
    const target = new URL(databaseUrl!);

    if (!target.pathname.endsWith('_test') || !['localhost', '127.0.0.1', 'postgres'].includes(target.hostname)) {
      throw new Error('Signup integration requires a local disposable database ending in _test');
    }

    await database!.unsafe(await Bun.file(new URL('../../database/schemas.sql', import.meta.url)).text());
  });

  beforeEach(async () => {
    await database!`TRUNCATE users CASCADE`;
  });

  afterAll(async () => {
    await database!.end();
  });

  test('email-only signup completes in one transaction and invalidates its draft', async () => {
    const email = 'email-only@example.test';
    const started = await request('', {email, username: 'Fixture', password: 'Synthetic-password-2026!', enableTwoFactor: false});
    const signup = started.body.signup;

    expect(started.status).toBe(200);
    expect((await request('/resume', {signup})).body).not.toHaveProperty('secret');
    expect((await request('/complete', {signup})).status).toBe(400);
    expect((await request('/email', {signup, access: codes.get(email)})).body.ready).toBe(true);

    const completed = await request('/complete', {signup});

    expect(completed.status).toBe(200);
    expect(completed.body.token).toStartWith('ss_session_');
    expect((await request('/resume', {signup})).status).toBe(410);
    expect((await database!`SELECT id FROM users`).length).toBe(1);
    expect((await database!`SELECT id FROM sessions`).length).toBe(1);
  });

  test('verified authenticator and recovery backup resume safely before completion', async () => {
    const email = 'authenticator@example.test';
    const started = await request('', {email, username: 'Fixture', password: 'Synthetic-password-2026!', enableTwoFactor: true});
    const signup = started.body.signup;
    const unverified = await request('/resume', {signup});

    expect(unverified.body.stage).toBe('email');
    expect(unverified.body).not.toHaveProperty('secret');
    expect(unverified.body).not.toHaveProperty('password');

    const enrollment = await request('/email', {signup, access: codes.get(email)});
    const token = createTOTP(enrollment.body.secret, 'Fixture').generate();
    const backup = await request('/recovery', {signup, token});

    expect(backup.status).toBe(200);
    expect(backup.body.recovery).toHaveLength(6);
    expect((await request('/resume', {signup})).body.recovery).toEqual(backup.body.recovery);
    expect((await request('/complete', {signup, savedRecovery: false})).status).toBe(400);
    expect((await request('/complete', {signup, savedRecovery: true})).status).toBe(200);
    expect((await request('/resume', {signup})).status).toBe(410);
    expect((await database!`SELECT totp FROM users`)[0].totp).toStartWith('sealed.v1.');
  });
});
