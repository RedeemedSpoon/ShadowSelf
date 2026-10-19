<script lang="ts">
  import type {Snippet} from 'svelte';
  import type {HTMLButtonAttributes} from 'svelte/elements';
  import Icon from './Icon.svelte';

  let {
    children,
    loading = false,
    variant = 'primary',
    icon,
    class: className = '',
    disabled,
    type = 'button',
    ...rest
  }: HTMLButtonAttributes & {
    children?: Snippet;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'quiet';
    icon?: string;
  } = $props();
</script>

<button
  {...rest}
  {type}
  class="control-button {variant} {className}"
  disabled={disabled || loading}
  aria-busy={loading}>
  {#if loading}<span class="spinner" aria-hidden="true"></span>{:else if icon}<Icon name={icon} size={17} />{/if}
  {@render children?.()}
</button>
