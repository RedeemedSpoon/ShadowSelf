<script lang="ts">
  import type {Component} from 'svelte';

  interface Props {
    name: string;
    type: string;
    fill?: boolean;
    icon?: Component;
    value?: string;
    placeholder?: string;
    className?: {wrapper?: string; input?: string; label?: string; icon?: string};
    handleInput?: (e: Event) => void;
  }

  let {icon, name, value, type, fill, placeholder, className, handleInput}: Props = $props();
</script>

<div class="group/input flex flex-initial {className?.wrapper}">
  <label title={name} for={name} class={className?.label}>
    {#if icon}
      {@const SvelteComponent = icon}
      <SvelteComponent
        {fill}
        className="mx-4 stroke-neutral-500 fill-neutral-500 transition-all duration-300 ease-in-out group-focus-within/input:stroke-neutral-400 group-focus-within/input:fill-neutral-400 {className?.icon}" />
    {/if}
  </label>
  <input id={name} {name} {value} {type} oninput={handleInput} {placeholder} class={className?.input} required />
</div>

<style lang="postcss">
  @reference "$style";

  label {
    @apply ring-primary-600 flex items-center justify-center transition-all duration-300 ease-in-out group-focus-within/input:ring-2;
    @apply rounded-l-xl border border-neutral-800 !border-r-transparent bg-transparent;
  }

  input:not(.alternative) {
    @apply ring-primary-600 ml-px w-full rounded-l-none! group-focus-within/input:ring-2;
  }
</style>
