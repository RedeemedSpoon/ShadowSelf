<script lang="ts">
  import type {Snippet} from 'svelte';
  import type {HTMLButtonAttributes} from 'svelte/elements';
  import Icon from './Icon.svelte';

  let {
    children,
    loading = false,
    variant = 'primary',
    icon,
    iconPosition,
    class: className = '',
    disabled,
    type = 'button',
    ...rest
  }: HTMLButtonAttributes & {
    children?: Snippet;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'quiet';
    icon?: string;
    iconPosition?: 'start' | 'end';
  } = $props();

  const trailingIcon = $derived(
    iconPosition === 'end' || (iconPosition !== 'start' && (icon === 'arrow' || icon === 'external')),
  );
</script>

{#snippet indicator()}
  <span class="button-indicator" aria-hidden="true">
    {#if loading}<span class="spinner"></span>{:else if icon}<Icon name={icon} size={15} />{/if}
  </span>
{/snippet}

<button
  {...rest}
  {type}
  class="control-button {variant} {className}"
  disabled={disabled || loading}
  aria-busy={loading}>
  {#if !trailingIcon && (icon || loading)}{@render indicator()}{/if}
  <span class="button-label">{@render children?.()}</span>
  {#if trailingIcon}{@render indicator()}{/if}
</button>
