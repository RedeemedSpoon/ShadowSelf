<script lang="ts">
  import {PURCHASE_CONFETTI} from '$constant';
  import PurchaseModal from './PurchaseModal.svelte';
  import Button from '$component/ui/Button.svelte';

  let {
    open = $bindable(false),
    renewal = false,
    oncontinue,
    ondismiss,
  }: {
    open?: boolean;
    renewal?: boolean;
    oncontinue: () => void | Promise<void>;
    ondismiss: () => void;
  } = $props();
  let proceeding = $state(false);

  async function proceed() {
    proceeding = true;

    try {
      await oncontinue();
    } finally {
      proceeding = false;
    }
  }
</script>

<PurchaseModal
  bind:open
  title={renewal ? 'Identity renewed' : 'Payment confirmed'}
  label="PAYMENT COMPLETE"
  {ondismiss}>
  {#if open}
    <div class="success-content" role="status" aria-live="polite">
      <div class="success-emblem">
        <div class="confetti" aria-hidden="true">
          {#each PURCHASE_CONFETTI as piece, index (index)}
            <span
              style:--x="{piece.x}px"
              style:--y="{piece.y}px"
              style:--delay="{piece.delay}ms"
              style:--rotation="{piece.rotation}deg"
              style:background={piece.color}></span>
          {/each}
        </div>
        <div class="success-check">
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="m13 24 8 8 15-17" pathLength="1" />
          </svg>
        </div>
      </div>
      <h3>{renewal ? 'Your identity stays with you.' : 'Your identity is ready to create.'}</h3>
      <p>{renewal ? 'Your access has been renewed.' : 'Continue to set up your new identity.'}</p>
      <div class="success-actions">
        <Button variant="secondary" disabled={proceeding} onclick={ondismiss}>Back</Button>
        <Button loading={proceeding} onclick={proceed}>Proceed</Button>
      </div>
    </div>
  {/if}
</PurchaseModal>

<style>
  .success-content {
    text-align: center;
    padding: 22px 10px 4px;
  }
  .success-emblem {
    position: relative;
    display: grid;
    place-items: center;
    height: 138px;
    margin-bottom: 12px;
  }
  .success-check {
    display: grid;
    place-items: center;
    width: 82px;
    height: 82px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #9b91ff22, #4938c912);
    border: 1px solid color-mix(in srgb, var(--accent-light) 35%, transparent);
    box-shadow:
      0 0 50px #6253ec20,
      inset 0 0 20px #8170ee0c;
    color: var(--accent-light);
    animation: check-appear 620ms cubic-bezier(0.2, 1.5, 0.5, 1) both;
  }
  .success-check svg {
    width: 48px;
    height: 48px;
    overflow: visible;
  }
  .success-check path {
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1;
    animation: check-draw 420ms 200ms ease-out both;
  }
  .success-content h3 {
    font-size: 21px;
    font-weight: 550;
    letter-spacing: -0.5px;
    color: #e1d9ff;
    margin: 0 0 13px;
  }
  .success-content p {
    font-size: 12px;
    color: #a69bc8;
    margin: 0;
  }
  .success-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 30px;
  }
  .confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .confetti span {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 8px;
    opacity: 0;
    border-radius: 1px;
    animation: confetti-burst 950ms ease-out calc(320ms + var(--delay)) both;
  }
  @keyframes check-appear {
    from {
      opacity: 0;
      transform: scale(0.55);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes check-draw {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes confetti-burst {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.4);
    }
    12% {
      opacity: 1;
    }
    65% {
      opacity: 0.7;
    }
    100% {
      opacity: 0;
      transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) rotate(var(--rotation)) scale(0.5);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .confetti {
      display: none;
    }
    .success-check,
    .success-check path {
      animation: none;
    }
  }
</style>
