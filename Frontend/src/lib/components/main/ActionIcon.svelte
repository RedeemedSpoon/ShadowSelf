<script lang="ts">
  import type {Component} from 'svelte';

  interface Props {
    size?: 'big' | 'small';
    action: () => void;
    icon: Component;
    title: string;
  }

  let {icon, action, title, size = 'big'}: Props = $props();
  const width = size === 'big' ? 'w-8 h-8' : 'w-4 h-4';
</script>

<button class="group" type="button" onclick={action} {title}>
  {#if icon}
    {@const SvelteComponent = icon}
    <SvelteComponent className={'transition-all duration-300 group-hover:stroke-primary-600 ' + width} />
  {/if}
</button>

<style lang="postcss">
  button {
    @apply w-fit cursor-pointer rounded-lg border-2 border-neutral-300/75 !bg-none p-1 !shadow-transparent;
    @apply hover:border-primary-600 transition-all duration-300 hover:bg-neutral-500/5;
  }
</style>
