<script lang="ts">
  import type {Snippet} from 'svelte';
  import {Loader} from '$component';
  import {fetching} from '$store';

  interface Props {
    name?: string;
    index?: number;
    className?: string;
    formaction?: string;
    onclick?: () => void;
    children?: Snippet;
    type?: 'submit' | 'button' | 'reset';
  }

  let {type = 'submit', index = 1, name, className, formaction, onclick, children}: Props = $props();
</script>

<button {name} {onclick} {formaction} {type} class={className} disabled={$fetching === index}>
  {@render children?.()}
  <Loader {index} />
</button>

<style lang="postcss">
  button {
    @apply disabled:shadow-primary-950 flex items-center justify-center gap-3 text-nowrap disabled:cursor-not-allowed;
    @apply disabled:hover:bg-pos-0 disabled:hover:shadow-primary-950 disabled:opacity-80;
  }
</style>
