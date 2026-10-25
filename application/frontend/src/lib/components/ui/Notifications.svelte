<script lang="ts">
  import {onMount} from 'svelte';
  import {NOTIFICATION_DURATION} from '$constant';
  import {notifications} from '$store';
  import type {AppNotice} from '$type';
  import Icon from './Icon.svelte';

  let now = $state(Date.now());
  let outlet = $state<HTMLDivElement>();
  let host = $state<HTMLDivElement>();

  function positionHost() {
    if (!host || !outlet) {
      return;
    }

    const target = document.querySelector('dialog:modal') || outlet;

    if (host.parentElement !== target) {
      target.append(host);
    }

    if (host.matches(':popover-open')) {
      host.hidePopover();
    }

    if ($notifications.length) {
      host.showPopover();
    }
  }

  $effect(positionHost);

  $effect(() => {
    if (!$notifications.length) {
      return;
    }

    now = Date.now();

    const timer = setInterval(() => {
      now = Date.now();
    }, 50);

    return () => clearInterval(timer);
  });

  onMount(() => {
    const onDialogClose = (event: Event) => {
      if (event.target instanceof HTMLDialogElement) {
        positionHost();
      }
    };

    document.addEventListener('close', onDialogClose, true);

    return () => document.removeEventListener('close', onDialogClose, true);
  });

  function dismiss(notice: AppNotice) {
    notifications.update((items) => items.filter((item) => item.id !== notice.id));
    notice.ondismiss();
  }
</script>

<div bind:this={outlet}>
  <div bind:this={host} popover="manual" class="notification-stack" aria-label="Notifications">
    {#each $notifications as notice (notice.id)}
      <div class="status-message {notice.kind}" role={notice.kind === 'error' ? 'alert' : 'status'}>
        <Icon name={notice.kind === 'error' ? 'warning' : notice.kind === 'success' ? 'check' : 'info'} size={18} />
        <span>{notice.message}</span>
        <button type="button" aria-label="Dismiss notice" onclick={() => dismiss(notice)}>
          <Icon name="close" size={15} />
        </button>
        <span
          class="notification-progress"
          aria-hidden="true"
          style:transform={`scaleX(${Math.max(0, (notice.expiresAt - now) / NOTIFICATION_DURATION)})`}></span>
      </div>
    {/each}
  </div>
</div>

<style>
  .notification-stack {
    position: fixed;
    inset: 20px 20px auto auto;
    width: min(420px, calc(100vw - 40px));
    max-height: calc(100dvh - 40px);
    overflow: auto;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    pointer-events: none;
  }
  .notification-stack:popover-open {
    display: grid;
    gap: 10px;
  }
  .status-message {
    position: relative;
    align-items: center;
    overflow: hidden;
    margin: 0;
    background: #10192c;
    box-shadow: 0 8px 30px #0005;
    pointer-events: auto;
  }
  .status-message > span:not(.notification-progress) {
    flex: 1;
    overflow-wrap: anywhere;
  }
  button {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: inherit;
  }
  button:hover,
  button:focus-visible {
    color: var(--status-action-hover, #c0dbff);
    background: color-mix(in srgb, currentColor 12%, transparent);
  }
  button:active {
    color: var(--status-action-pressed, #d5e7ff);
    background: color-mix(in srgb, currentColor 20%, transparent);
  }
  .status-message :global(svg) {
    margin-top: 0;
  }
  button :global(svg) {
    color: inherit;
  }
  .notification-progress {
    position: absolute;
    inset: auto 0 0;
    height: 2px;
    background: currentColor;
    transform-origin: left;
    transition: transform 50ms linear;
  }
</style>
