import {expect, test} from 'bun:test';

process.env.NODE_ENV = 'test';
process.env.POSTGRES_DB = 'shadowself_test_unused';
process.env.APP_DB_PASSWORD = 'synthetic';
process.env.SECRET_SAUCE = 'synthetic-provider-test-secret';

const {phoneProvider} = await import('../src/core/phone-provider');
const {verificationEmail} = await import('../src/utils/email-smtp');
const {portraitPrompt} = await import('../src/utils/prompts');
const {trustedCookieRequest} = await import('../src/middlewares/session-auth');
const {ONION_ORIGIN} = await import('../src/core/constants');

test('unconfigured phone operations fail explicitly instead of returning empty success', () => {
  expect(() => phoneProvider.available('Anywhere')).toThrow('Phone service is unavailable');
  expect(() => phoneProvider.send('+12025550123', '+12025550124', 'Fixture')).toThrow('Phone service is unavailable');
});

test('verification messages have purpose-specific subjects, plain text, and escaped HTML', () => {
  for (const reason of ['confirm', 'change', 'recover'] as const) {
    const message = verificationEmail('<synthetic&code>', reason);

    expect(message.subject).toStartWith('ShadowSelf:');
    expect(message.text).toContain('<synthetic&code>');
    expect(message.html).toContain('&lt;synthetic&amp;code&gt;');
    expect(message.html).not.toContain('<synthetic&code>');
    expect(message.html).toContain('role="presentation"');
    expect(message.html).not.toContain('<img');
  }

  expect(verificationEmail('fixture', 'recover').subject).toContain('sign-in code');
});

test('portrait prompt leaves scene and camera choices open', () => {
  const prompt = portraitPrompt('Tunis', 'arab', 32, 'female', 'Enjoys photography');

  expect(prompt).toContain('Choose the setting, framing, clothing, expression, pose, and lighting freely');
  expect(prompt).toContain('fictional adult');
  expect(prompt).not.toContain('DSLR');
});

test('cookie mutations require a trusted origin', () => {
  expect(trustedCookieRequest(new Request('http://localhost', {method: 'POST', headers: {origin: ONION_ORIGIN}}))).toBe(
    true,
  );
  expect(
    trustedCookieRequest(
      new Request('http://localhost', {method: 'POST', headers: {origin: 'https://untrusted.example'}}),
    ),
  ).toBe(false);
});
