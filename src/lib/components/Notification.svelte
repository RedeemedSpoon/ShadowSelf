<script lang="ts">
  import { notification } from '$store';

  $: type = $notification.type;
  $: message = $notification.message;
</script>

  <div class="notification {type}">
    <p>{message}</p>
  </div>

<style lang="postcss">
  .notification {
    @apply text-neutral-100;
  }

  .notification p {
    @apply p-4;
  }

  .error {
    @apply bg-alert-500;
  }

  .info {
    @apply bg-info-500;
  }

  .success {
    @apply bg-success-500;
  }
</style>
