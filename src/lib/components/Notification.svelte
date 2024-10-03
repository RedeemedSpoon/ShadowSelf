<script lang="ts">
  import {notification} from '$store';
  import {alert, info, success} from '$images';
  import {slide} from 'svelte/transition';

  $: id = $notification.id;
  $: type = $notification.type;
  $: message = $notification.message;
  const icons = {
    alert: alert,
    info: info,
    success: success,
  };

  const handleClick = () => ($notification = {id: null, type: 'info', message: ''});
</script>

{#if id}
  <div class="notification {type}" transition:slide={{axis: 'x'}} on:click={handleClick} aria-hidden>
    <img src={icons[type]} alt={type} width="48px" height="48px" />
    <p>{message}</p>
  </div>
{/if}

<style lang="postcss">
  .notification {
    @apply fixed bottom-12 left-8 z-20 flex items-center border-l-8 bg-neutral-800 bg-opacity-90 p-6;
    @apply cursor-pointer shadow-md shadow-neutral-950 hover:bg-neutral-900;
  }

  p {
    @apply text-nowrap text-xl text-clip;
  }

  img {
    @apply mr-4;
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
