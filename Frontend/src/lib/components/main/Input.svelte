<script lang="ts">
  import type {Component} from 'svelte';

  interface Props {
    icon?: Component;
    name: string;
    type: string;
    placeholder?: string;
  }

  let {icon, name, type, placeholder}: Props = $props();
</script>

<div class="flex items-end">
  <label title={name} for={name}>
    {#if icon}
      {@const SvelteComponent = icon}
      <SvelteComponent className="w-8 h-8 fill-neutral-800 stroke-neutral-800" />
    {/if}
  </label>
  <input id={name} {name} {type} {placeholder} class="!rounded-l-none" required />
</div>

<style lang="postcss">
  label {
    @apply flex h-full w-full items-center justify-center px-3;
    @apply rounded-l-xl border border-neutral-800 border-r-transparent;
  }
</style>
