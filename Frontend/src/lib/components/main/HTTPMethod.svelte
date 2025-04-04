<script lang="ts">
  import type {Method} from '$type';

  let {method}: {method: Method | undefined} = $props();
</script>

{#if method}
  <span class="{method.toLowerCase()} text-nowrap">{method}</span>
{/if}

<style lang="postcss">
  span {
    @apply rounded-full bg-neutral-950 px-2 py-1 text-sm;
  }

  .get {
    @apply bg-blue-600 text-blue-100;
  }

  .post {
    @apply bg-green-600 text-green-100;
  }

  .put {
    @apply bg-yellow-600 text-yellow-100;
  }

  .patch {
    @apply bg-purple-600 text-purple-100;
  }

  .delete {
    @apply bg-red-600 text-red-100;
  }
</style>
