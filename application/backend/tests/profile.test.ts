import {expect, mock, test} from 'bun:test';
import {Elysia} from 'elysia';

const updates: {statement: string; values: unknown[]}[] = [];
const profile = {
  id: 'abcdef123456',
  status: 'active',
  location: 'US, Seattle, United States',
  name: 'Before',
  bio: 'Before biography',
  sex: 'male',
  age: 28,
  ethnicity: 'caucasian',
  picture: 'before',
};

mock.module('@core/services', () => ({
  sql: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    updates.push({statement: strings.join('?'), values});

    return [{id: profile.id}];
  },
}));
mock.module('@utils/prompts', () => ({generateProfile: async () => 'synthetic-generated-portrait'}));
mock.module('@middlewares/middleware-api', () => ({
  default: (app: Elysia) => app.derive(() => ({identity: {...profile}})),
}));

const routes = (await import('../src/routes/public-api/api-information')).default;

async function generate(kind: string) {
  const response = await routes.handle(
    new Request(`http://localhost/api/identities/${profile.id}/profile/${kind}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({}),
    }),
  );

  expect(response.status).toBe(200);

  return response.json();
}

test('generated profile fields are persisted before the updated value is returned', async () => {
  for (const field of ['name', 'bio', 'picture']) {
    const previous = updates.length;
    const response = await generate(field);
    const update = updates[previous];

    expect(update.statement).toContain(`UPDATE identities SET ${field}`);
    expect(update.statement).toContain("status = 'active'");
    expect(update.values[0]).toBe(response[field]);
    expect(update.values[1]).toBe(profile.id);
  }
});
