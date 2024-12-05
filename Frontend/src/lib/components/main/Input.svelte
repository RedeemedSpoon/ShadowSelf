<script lang="ts">
  import type {Component} from 'svelte';

  interface Props {
    name: string;
    type: string;
    icon?: Component;
    placeholder?: string;
    className?: {wrapper?: string; input?: string; label: string; icon?: string};
    handleInput?: (e: Event) => void;
  }

  let {icon, name, type, placeholder, className, handleInput}: Props = $props();
</script>

<div class="group flex flex-initial {className?.wrapper}">
  <label title={name} for={name} class={className?.label}>
    {#if icon}
      {@const SvelteComponent = icon}
      <SvelteComponent className="mx-4 stroke-neutral-800 fill-neutral-800 {className?.icon}" />
    {/if}
  </label>
  <input id={name} {name} {type} oninput={handleInput} {placeholder} class={className?.input} required />
</div>

<style lang="postcss">
  label {
    @apply flex items-center justify-center transition-all duration-300 ease-in-out;
    @apply rounded-l-xl border border-neutral-800 border-r-transparent bg-transparent;
  }

  input {
    @apply group-focus-within:ring-primary-600 ml-px w-full !rounded-l-none group-focus-within:ring-2;
  }
</style>
