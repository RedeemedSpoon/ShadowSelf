<script lang="ts">
  import type {Component} from 'svelte';
  import {CheckmarkIcon} from '$icon';

  interface Props {
    action: () => void;
    icon: Component;
    title: string;
    commit?: boolean;
    size?: 'big' | 'small';
  }

  let {icon, action, commit, title, size = 'big'}: Props = $props();

  let on = $state(false);
  const width = size === 'big' ? 'w-8 h-8' : 'w-4 h-4';
</script>

<button class="group {commit && on && 'primary-color'}" type="button" onclick={() => (action(), (on = !on))} {title}>
  {#if commit && on}
    <CheckmarkIcon className={width + ' fill-primary-600 stroke-none'} />
  {:else}
    {@const SvelteComponent = icon}
    <SvelteComponent className={width + ' stroke-neutral-300'} />
  {/if}
</button>

<style lang="postcss">
  button {
    @apply w-fit cursor-pointer rounded-lg border-2 border-neutral-300/75 !bg-none p-1 !shadow-transparent transition-none hover:bg-neutral-300/10;
  }

  .primary-color {
    @apply border-primary-600 hover:border-primary-600;
  }
</style>
