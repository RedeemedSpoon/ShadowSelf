<script lang="ts">
  import type {Component} from 'svelte';

  interface Props {
    size?: 'big' | 'small';
    action: () => void;
    icon: Component;
    title: string;
  }

  let {icon, action, title, size = 'big'}: Props = $props();
</script>

<button type="button" onclick={action} {title}>
  {#if icon}
    {@const SvelteComponent = icon}
    <SvelteComponent className={size === 'big' ? '!w-8 !h-8' : '!w-4 !h-4'} />
  {/if}
</button>

<style lang="postcss">
  button {
    @apply w-fit cursor-pointer rounded-lg border-2 border-neutral-600 !bg-none p-1 !shadow-transparent hover:bg-neutral-300/10;
  }
</style>
