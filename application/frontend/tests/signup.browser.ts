import {mount, unmount, tick} from 'svelte';
import Signup from '../src/routes/signup/+page.svelte';
import type {SignupState} from '../src/lib/types';

export async function runSignupBrowserRegressions() {
  const target = document.createElement('div');
  document.body.append(target);
  const results: string[] = [];

  try {
    for (const stage of ['account', 'email', 'authenticator', 'recovery'] as const) {
      const registration: SignupState = {
        stage,
        email: 'signup-fixture@example.test',
        username: 'Fixture',
        secret: 'A'.repeat(32),
        qr: '',
        recovery: ['synthetic-one', 'synthetic-two'],
      };
      const component = mount(Signup, {target, props: {data: {user: '', message: '', registration}, form: null, params: {}}});

      try {
        await tick();
        const form = target.querySelector('form');

        if (!form || target.querySelector('[name="paymentID"]')) {
          throw new Error('Signup must expose the current action without optional billing stages');
        }

        if (stage === 'account' && target.querySelector<HTMLInputElement>('[name="username"]')?.maxLength !== 25) {
          throw new Error('Signup username must agree with API and storage bounds');
        }

        if (stage === 'authenticator' && (!target.querySelector('[name="token"]') || !target.textContent?.includes(registration.secret))) {
          throw new Error('Restored authenticator enrollment must display enrollment and verification together');
        }

        if (stage === 'recovery') {
          const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');

          if (!button?.disabled || !target.textContent?.includes('synthetic-one')) {
            throw new Error('Restored recovery codes must remain visible with backup acknowledgement required');
          }
        }

        results.push(`signup ${stage}`);
      } finally {
        await unmount(component);
      }
    }
  } finally {
    target.remove();
  }

  return results;
}
