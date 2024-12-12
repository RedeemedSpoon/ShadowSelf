<script lang="ts">
  import type {Snippet} from 'svelte';
  import {Loader} from '$component';
  import {isFetching} from '$store';

  interface Props {
    name?: string;
    className?: string;
    formaction?: string;
    onclick?: () => void;
    children?: Snippet;
    type?: 'submit' | 'button' | 'reset';
  }

  let {type = 'submit', name, className, formaction, onclick, children}: Props = $props();
</script>

<button {name} {onclick} {formaction} {type} class={className} disabled={$isFetching}>
  {@render children?.()}
  <Loader />
</button>

<style lang="postcss">
  button {
    @apply disabled:shadow-primary-950 flex items-center justify-center gap-3 text-nowrap disabled:cursor-not-allowed;
    @apply disabled:hover:bg-pos-0 disabled:hover:shadow-primary-950 disabled:opacity-80;
  }
</style>
