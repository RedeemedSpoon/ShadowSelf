<script lang="ts">
  import type {Snippet} from 'svelte';
  import {Loader} from '$component';
  import {fetchIndex} from '$store';

  interface Props {
    name?: string;
    index?: number;
    className?: string;
    formaction?: string;
    disabled?: boolean;
    children?: Snippet;
    onclick?: () => void;
    type?: 'submit' | 'button' | 'reset';
  }

  let {type = 'submit', index = 1, disabled, name, className, formaction, onclick, children}: Props = $props();
</script>

<button {name} {onclick} {formaction} {type} class={className} disabled={$fetchIndex === index || disabled}>
  {@render children?.()}
  <Loader {index} primaryColor={className === 'alt'} />
</button>

<style lang="postcss">
  @reference "$style";

  button {
    @apply flex items-center justify-center gap-3 text-nowrap;
  }
</style>
