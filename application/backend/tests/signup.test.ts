import {describe, expect, test} from 'bun:test';
import {createSignupDraft, getSignupDraft, signupProgress} from '@core/states';
import {encryptSecret} from '@core/security';

describe('signup recovery', () => {
  test('expires an invalid or missing draft without exposing state', () => {
    expect(signupProgress('missing')).toBeUndefined();
  });

  test('restores verified enrollment without exposing the password hash', () => {
    const id = createSignupDraft('fixture@example.test', 'synthetic-hash', 'Fixture', true)!;
    const draft = getSignupDraft(id)!;
    draft.verified = true;
    draft.secret = 'A'.repeat(32);

    const progress = signupProgress(id)!;

    expect(progress.stage).toBe('authenticator');
    expect(progress.secret).toBe(draft.secret);
    expect(progress).not.toHaveProperty('password');
  });

  test('restores recovery codes only inside a verified draft and consumes it on completion', () => {
    const id = createSignupDraft('fixture@example.test', 'synthetic-hash', 'Fixture', true)!;
    const draft = getSignupDraft(id)!;
    draft.secret = 'A'.repeat(32);
    draft.recoveryHashes = ['synthetic-hash'];
    draft.encryptedRecovery = encryptSecret(JSON.stringify(['synthetic-recovery-code']));

    expect(signupProgress(id)?.recovery).toBeUndefined();

    draft.verified = true;

    expect(signupProgress(id)?.recovery).toEqual(['synthetic-recovery-code']);
    expect(signupProgress(id)?.stage).toBe('recovery');

    getSignupDraft(id, true);

    expect(signupProgress(id)).toBeUndefined();
  });
});
