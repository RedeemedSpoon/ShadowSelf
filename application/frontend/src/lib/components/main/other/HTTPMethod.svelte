<script lang="ts">
  import type {Method} from '$type';

  interface Props {
    method?: Method;
    alt?: boolean;
  }
  let {method, alt}: Props = $props();
</script>

{#if method}
  <span class="{method.toLowerCase()} {alt && 'alt'} text-nowrap">{method}</span>
{/if}

<style lang="postcss">
  @reference "$style";

  span {
    @apply rounded-full bg-neutral-950 px-2 py-1 text-sm;
  }

  span.alt {
    @apply px-0 pr-2 font-sans text-lg;
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

  .get.alt {
    @apply bg-transparent text-blue-600;
  }

  .post.alt {
    @apply bg-transparent text-green-600;
  }

  .put.alt {
    @apply bg-transparent text-yellow-600;
  }

  .patch.alt {
    @apply bg-transparent text-purple-600;
  }

  .delete.alt {
    @apply bg-transparent text-red-600;
  }
</style>
