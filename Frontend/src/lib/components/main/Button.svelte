<script lang="ts">
  import type {Snippet} from 'svelte';
  import {Loader} from '$component';
  import {isFetching} from '$store';

  interface Props {
    name?: string;
    className?: string;
    children?: Snippet;
  }

  let {name, className, children}: Props = $props();
</script>

<button {name} type="submit" class={className} disabled={$isFetching}>
  {@render children?.()}
  <Loader />
</button>

<style lang="postcss">
  button {
    @apply flex items-center justify-center gap-3;
    @apply disabled:hover:bg-pos-0 disabled:hover:shadow-primary-900 disabled:opacity-80;
  }
</style>
