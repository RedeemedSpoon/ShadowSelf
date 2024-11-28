<script lang="ts">
  import {AlertIcon, InfoIcon, SuccessIcon} from '$icon';
  import {slide} from 'svelte/transition';
  import {notification} from '$store';

  let id = $derived($notification.id);
  let type = $derived($notification.type);
  let message = $derived($notification.message);

  const handleClick = () => ($notification = {id: null, type: 'info', message: ''});
</script>

{#if id}
  <div class="notification {type}" transition:slide={{axis: 'x'}} onclick={handleClick} aria-hidden="true">
    {#if type === 'alert'}
      <AlertIcon />
    {:else if type === 'info'}
      <InfoIcon />
    {:else if type === 'success'}
      <SuccessIcon />
    {/if}
    <p class="text-clip text-xl sm:text-nowrap">{message}</p>
  </div>
{/if}

<style lang="postcss">
  .notification {
    @apply fixed bottom-12 left-8 z-[999] flex items-center border-l-8 bg-neutral-800 bg-opacity-90 p-6;
    @apply cursor-pointer shadow-md shadow-neutral-950 hover:bg-neutral-900;
    @apply max-sm:-left-6 max-sm:bottom-4 max-sm:scale-75;
  }

  .alert {
    @apply border-alert-500;
  }

  .info {
    @apply border-info-500;
  }

  .success {
    @apply border-success-500;
  }
</style>
