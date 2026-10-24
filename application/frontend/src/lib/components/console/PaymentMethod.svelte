<script lang="ts">
  import {onMount} from 'svelte';
  import {loadStripe} from '@stripe/stripe-js/pure';
  import type {Stripe, StripeCardElement} from '@stripe/stripe-js';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';

  let {stripeKey, onready}: {stripeKey: string; onready: (id: string) => void} = $props();
  let mountPoint: HTMLDivElement;
  let stripe: Stripe | null = null;
  let card: StripeCardElement;
  let pending = $state(true);
  let ready = $state(false);
  let message = $state('');
  let kind = $state<'info' | 'error' | 'success'>('info');

  onMount(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!stripeKey) {
          throw new Error('Card payments are unavailable.');
        }

        loadStripe.setLoadParameters({advancedFraudSignals: false});
        stripe = await loadStripe(stripeKey);

        if (cancelled) {
          return;
        }

        if (!stripe) {
          throw new Error('Could not load card payments.');
        }

        const invalidColor = getComputedStyle(document.documentElement).getPropertyValue('--danger-color').trim();

        card = stripe.elements().create('card', {
          style: {
            base: {
              color: '#e6ebff',
              fontFamily: 'Inter,sans-serif',
              fontSize: '14px',
              '::placeholder': {color: '#66738d'},
            },
            invalid: {color: invalidColor},
          },
        });
        card.on('ready', () => (ready = true));
        card.on('change', () => {
          onready('');
          message = '';
          kind = 'info';
        });
        card.mount(mountPoint);
      } catch (error) {
        message = error instanceof Error ? error.message : 'Could not load card payments.';
        kind = 'error';
      } finally {
        pending = false;
      }
    })();

    return () => {
      cancelled = true;
      card?.destroy();
    };
  });

  async function saveCard() {
    if (!stripe || !card || !ready || pending) {
      return;
    }

    pending = true;

    try {
      const result = await stripe.createPaymentMethod({type: 'card', card});

      if (result.error) {
        throw new Error(result.error.message);
      }

      onready(result.paymentMethod.id);
      message = 'Card validated.';
      kind = 'success';
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not validate this card.';
      kind = 'error';
    } finally {
      pending = false;
    }
  }
</script>

<div class="payment-card" class:unavailable={kind === 'error' && !ready} bind:this={mountPoint}></div>
<Status {message} {kind} />
{#if ready || pending}<div class="button-row payment-actions">
    <Button type="button" variant="secondary" loading={pending} disabled={!ready} onclick={saveCard}
      >Validate card</Button>
  </div>{/if}

<style>
  .payment-card {
    min-height: 43px;
    padding: 14px 10px;
    border: 1px solid color-mix(in srgb, var(--accent-light) 18.82%, transparent);
    border-radius: 5px;
    background: #070e1c;
  }
  .payment-actions {
    margin: 16px 0;
  }
  .unavailable {
    display: none;
  }
</style>
