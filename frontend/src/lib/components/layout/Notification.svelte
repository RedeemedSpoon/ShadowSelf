<script lang="ts">
  import {AlertIcon, InfoIcon, SuccessIcon} from '$icon';
  import {slide} from 'svelte/transition';
  import {notification} from '$store';

  let id = $derived($notification.id);
  let type = $derived($notification.type);
  let message = $derived($notification.message);

  const handleClick = () => ($notification = {id: null, type: 'info', message: ''});

  const icons = {
    alert: AlertIcon,
    info: InfoIcon,
    success: SuccessIcon,
  };
</script>

{#if id}
  <div class="notification {type}" transition:slide={{axis: 'x'}} onclick={handleClick} aria-hidden="true">
    {#if type}
      {@const SvelteComponent = icons[type]}
      <SvelteComponent />
    {/if}
    <p class="text-clip text-xl sm:text-nowrap">{message}</p>
  </div>
{/if}

<style lang="postcss">
  @reference "$style";

  .notification {
    @apply z-999 fixed bottom-12 left-8 flex items-center border-l-8 bg-neutral-800 p-6 opacity-90;
    @apply cursor-pointer shadow-md shadow-neutral-950 hover:bg-neutral-900;
    @apply max-sm:-left-6 max-sm:bottom-4 max-sm:scale-75;
  }

  .alert {
    @apply border-red-500;
  }

  .info {
    @apply border-yellow-500;
  }

  .success {
    @apply border-green-500;
  }
</style>
