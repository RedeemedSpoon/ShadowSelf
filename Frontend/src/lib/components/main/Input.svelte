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

<div class="flex flex-initial">
  <label title={name} for={name}>
    {#if icon}
      {@const SvelteComponent = icon}
      <SvelteComponent className="mx-4 fill-neutral-800 stroke-neutral-800" />
    {/if}
  </label>
  <input id={name} {name} {type} {placeholder} class="ml-[1px] w-full !rounded-l-none" required />
</div>

<style lang="postcss">
  label {
    @apply flex items-center justify-center transition-all duration-300 ease-in-out;
    @apply rounded-l-xl border border-neutral-800 border-r-transparent bg-transparent;
  }

  div:focus-within label {
    @apply ring-primary-600 ring-2;
  }
</style>
