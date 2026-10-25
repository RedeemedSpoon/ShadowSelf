<script lang="ts">
  import {onMount} from 'svelte';
  import {loadStripe} from '@stripe/stripe-js/pure';
  import type {Stripe, StripeCardNumberElement, StripeCardExpiryElement, StripeCardCvcElement} from '@stripe/stripe-js';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';

  let {stripeKey, onready}: {stripeKey: string; onready: (id: string) => void | Promise<void>} = $props();
  let numberMount: HTMLDivElement;
  let expiryMount: HTMLDivElement;
  let cvcMount: HTMLDivElement;
  let stripe: Stripe | null = null;
  let card: StripeCardNumberElement;
  let expiry: StripeCardExpiryElement;
  let cvc: StripeCardCvcElement;
  let pending = $state(true);
  let complete = $state({number: false, expiry: false, cvc: false});
  let message = $state('');
  let clientSecret = '';
  let saved = $state(false);

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

        mountFields(stripe);
      } catch (error) {
        message = error instanceof Error ? error.message : 'Could not load card payments.';
      } finally {
        pending = false;
      }
    })();

    return () => {
      cancelled = true;
      card?.destroy();
      expiry?.destroy();
      cvc?.destroy();
    };
  });

  function mountFields(provider: Stripe) {
    const styles = getComputedStyle(document.documentElement);
    const style = {
      base: {
        color: '#e6ebff',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        lineHeight: '22px',
        '::placeholder': {color: '#66738d'},
      },
      invalid: {color: styles.getPropertyValue('--danger-color').trim()},
    };
    const elements = provider.elements();

    card = elements.create('cardNumber', {style, showIcon: true});
    expiry = elements.create('cardExpiry', {style});
    cvc = elements.create('cardCvc', {style});

    card.on('change', (event) => {
      complete = {...complete, number: event.complete};
      message = event.error?.message || '';
    });
    expiry.on('change', (event) => {
      complete = {...complete, expiry: event.complete};
      message = event.error?.message || '';
    });
    cvc.on('change', (event) => {
      complete = {...complete, cvc: event.complete};
      message = event.error?.message || '';
    });

    card.mount(numberMount);
    expiry.mount(expiryMount);
    cvc.mount(cvcMount);
  }

  async function saveCard() {
    if (!stripe || !card || pending || saved) {
      return;
    }

    pending = true;
    message = '';

    try {
      if (!clientSecret) {
        const response = await fetch('/settings/payment-setup', {method: 'POST'});
        const data = await response.json();

        if (!response.ok || !data.clientSecret) {
          throw new Error(data.error || 'Could not start card verification. Try again.');
        }

        clientSecret = data.clientSecret;
      }

      const result = await stripe.confirmCardSetup(clientSecret, {payment_method: {card}});

      if (result.error) {
        throw new Error(result.error.message || 'Could not verify this card.');
      }

      if (result.setupIntent.status !== 'succeeded') {
        throw new Error('Card verification is incomplete. Try again.');
      }

      card.update({disabled: true});
      expiry.update({disabled: true});
      cvc.update({disabled: true});

      await onready(result.setupIntent.id);
      saved = true;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not save this card.';
    } finally {
      pending = false;
    }
  }
</script>

<p>Stripe securely collects your card details. Your bank may ask you to verify the card with 3D Secure.</p>
<p class="payment-note">Saved for future subscription payments. No payment is taken now.</p>
<div class="card-fields" aria-busy={pending}>
  <div class="field">
    <span id="card-number-label">Card number</span>
    <div class="payment-input" aria-labelledby="card-number-label" bind:this={numberMount}></div>
  </div>
  <div class="card-details">
    <div class="field">
      <span id="card-expiry-label">Expiry date</span>
      <div class="payment-input" aria-labelledby="card-expiry-label" bind:this={expiryMount}></div>
    </div>
    <div class="field">
      <span id="card-cvc-label">Security code</span>
      <div class="payment-input" aria-labelledby="card-cvc-label" bind:this={cvcMount}></div>
    </div>
  </div>
</div>
<Status {message} kind="error" />
<div class="payment-actions">
  <Button
    icon="card"
    loading={pending}
    disabled={saved || !complete.number || !complete.expiry || !complete.cvc}
    onclick={saveCard}>Save payment card</Button>
</div>

<style>
  .card-fields {
    margin-top: 20px;
  }
  .card-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .field > span {
    font-size: 12px;
  }
  .payment-input {
    min-height: 44px;
    padding: 11px 14px;
    border: 1px solid color-mix(in srgb, var(--accent-light) 18.82%, transparent);
    border-radius: 5px;
    background: #070e1c;
  }
  .payment-input:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 15%, transparent);
  }
  .payment-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 18px;
  }
  .payment-note {
    font-size: 11px;
    margin: 8px 0 0;
  }
</style>
