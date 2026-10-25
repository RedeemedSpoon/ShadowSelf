<script lang="ts">
  import type {Snippet} from 'svelte';
  import {notifications} from '$store';
  import {NOTIFICATION_DURATION} from '$constant';
  import Icon from './Icon.svelte';

  let {
    message,
    kind = 'info',
    ondismiss,
    children,
  }: {
    message: string;
    kind?: 'info' | 'error' | 'success';
    ondismiss?: () => void;
    children?: Snippet;
  } = $props();
  const id = $props.id();
  const overlay = $derived(kind !== 'info' || !!ondismiss);

  $effect(() => {
    if (!message || !overlay) {
      return;
    }

    notifications.update((items) => [
      ...items.filter((item) => item.id !== id && (item.message !== message || item.kind !== kind)).slice(-2),
      {id, message, kind, expiresAt: Date.now() + NOTIFICATION_DURATION, ondismiss: () => ondismiss?.()},
    ]);

    const timer = setTimeout(() => {
      notifications.update((items) => items.filter((item) => item.id !== id));
    }, NOTIFICATION_DURATION);

    return () => {
      clearTimeout(timer);
      notifications.update((items) => items.filter((item) => item.id !== id));
    };
  });
</script>

{#if message && !overlay}
  <div class="status-message {kind}" role="status">
    <Icon name="info" size={18} />
    <span
      >{#if children}{@render children()}{:else}{message}{/if}</span>
  </div>
{/if}
