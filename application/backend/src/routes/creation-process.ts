import {provisionIdentity, withIdentityLock} from '@core/identity-service';
import middlewareApi from '@middlewares/middleware-api';
import {ETHNICITIES} from '@core/constants';
import {phoneProvider} from '@core/phone-provider';
import {generateProfile} from '@utils/prompts';
import {checkIdentity} from '@utils/checks';
import type {CreationDraft} from '@type';
import {ApiError} from '@core/security';
import {sql} from '@core/services';
import {faker} from '@faker-js/faker';
import {Elysia} from 'elysia';

async function loadDraft(identityID: string) {
  const rows = await sql`INSERT INTO creation_jobs (identity_id, status) VALUES (${identityID}, 'editing')
    ON CONFLICT (identity_id) DO UPDATE SET identity_id = EXCLUDED.identity_id RETURNING id, payload, status`;

  return {id: rows[0].id as string, draft: rows[0].payload as CreationDraft, status: rows[0].status as string};
}

async function saveDraft(identityID: string, input: CreationDraft) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError(400, 'invalid_request', 'Invalid creation draft');
  }

  for (const key of Object.keys(input)) {
    if (!['location', 'profile', 'email', 'phone', 'wallet'].includes(key)) {
      throw new ApiError(400, 'invalid_request', 'Unknown creation field');
    }

    const kind = key === 'profile' ? 'identity' : key;
    const value = key === 'profile' ? input.profile : {[key]: input[key as keyof CreationDraft]};
    const validation = await checkIdentity(kind, value);

    if (validation.error) {
      throw new ApiError(400, 'invalid_request', validation.error);
    }

    if (key === 'profile') {
      input = {...input, profile: validation as CreationDraft['profile']};
    }
  }

  return withIdentityLock(identityID, async (connection) => {
    const identities = await connection`SELECT status FROM identities WHERE id = ${identityID}`;

    if (identities[0]?.status !== 'inactive') {
      throw new ApiError(409, 'creation_unavailable', 'This identity is unavailable for creation');
    }

    const rows = await connection`INSERT INTO creation_jobs (identity_id, status, payload)
      VALUES (${identityID}, 'editing', ${connection.json(input as never)})
      ON CONFLICT (identity_id) DO UPDATE SET payload = creation_jobs.payload || EXCLUDED.payload
      WHERE creation_jobs.status = 'editing' RETURNING payload`;

    if (!rows.length) {
      throw new ApiError(409, 'creation_busy', 'Creation has reserved resources. Retry provisioning to finish');
    }

    return rows[0].payload as CreationDraft;
  });
}

export default new Elysia({prefix: '/api/identities/:id/creation'})
  .use(middlewareApi)
  .onBeforeHandle(({identity, request}) => {
    const provisionRetry = request.method === 'POST' && new URL(request.url).pathname.endsWith('/provision');

    if (request.method === 'GET' && ['active', 'frozen'].includes(identity?.status || '')) {
      return;
    }

    if (identity?.status === 'active' && provisionRetry) {
      return;
    }

    if (identity?.status !== 'inactive') {
      throw new ApiError(409, 'creation_unavailable', 'This identity is unavailable for creation');
    }
  })
  .get('/', async ({identity}) => {
    if (identity!.status !== 'inactive') {
      return {draft: {}, status: identity!.status, creationStatus: 'completed'};
    }

    const job = await loadDraft(identity!.id);

    return {draft: job.draft, status: identity!.status, creationStatus: job.status};
  })
  .put('/', async ({identity, body}) => ({draft: await saveDraft(identity!.id, body as CreationDraft)}))
  .post('/profile', async ({identity, body}) => {
    const input = body as {
      location?: string;
      regenerate?: CreationDraft['profile'];
      repeat?: {name?: boolean; bio?: boolean; sex?: 'male' | 'female'};
    };
    const job = await loadDraft(identity!.id);

    const location = input?.location || job.draft.location;

    if (typeof location !== 'string' || !location.trim() || location.length > 120) {
      throw new ApiError(400, 'invalid_request', 'Choose a location first');
    }

    if (input.repeat) {
      return {
        repeat: {
          ...(input.repeat.name ? {name: faker.person.fullName({sex: input.repeat.sex}).slice(0, 30)} : {}),
          ...(input.repeat.bio ? {bio: faker.person.bio().slice(0, 126)} : {}),
        },
      };
    }

    const sex = Math.random() > 0.5 ? 'male' : 'female';
    const profile = input.regenerate || {
      name: faker.person.fullName({sex}).slice(0, 30),
      bio: faker.person.bio().slice(0, 126),
      sex,
      ethnicity: ETHNICITIES[Math.floor(Math.random() * ETHNICITIES.length)],
      age: Math.floor(Math.random() * 42) + 18,
    };
    const validation = await checkIdentity('profile', profile);

    if (validation.error) {
      throw new ApiError(400, 'invalid_request', validation.error);
    }

    const picture = await generateProfile(location, profile.age, profile.sex, profile.ethnicity, profile.bio);
    await saveDraft(identity!.id, {location, profile: {...profile, picture}});

    return {identity: {...profile, picture}};
  })
  .post('/email', async ({identity, body}) => {
    const profile = (body as {profile?: CreationDraft['profile']})?.profile;

    if (!profile) {
      throw new ApiError(400, 'invalid_request', 'Profile is required');
    }

    await saveDraft(identity!.id, {profile});

    const localPart = profile.name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30);

    return {email: localPart || `identity${identity!.id}`};
  })
  .post('/phones', async ({identity, body}) => {
    const input = body as {email?: string; location?: string};

    if (!input?.email) {
      throw new ApiError(400, 'invalid_request', 'Email is required');
    }

    const draft = await saveDraft(identity!.id, {
      email: input.email,
      ...(input.location ? {location: input.location} : {}),
    });

    if (!draft.location) {
      throw new ApiError(400, 'invalid_request', 'Choose a location first');
    }

    return {phone: await phoneProvider.available(draft.location)};
  })
  .post('/provision', async ({identity}) => {
    await provisionIdentity(identity!.id);

    return {success: true, identityID: identity!.id};
  });
