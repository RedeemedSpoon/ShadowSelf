<script lang="ts">
  import type {Component} from 'svelte';
  import {CheckmarkIcon} from '$icon';
  import {Tooltip} from '$component';

  interface Props {
    action: () => void;
    icon: Component;
    title: string;
    commit?: boolean;
    disabled?: boolean;
    showPassword?: boolean;
    activeStatus?: boolean;
    size?: 'big' | 'small';
  }

  let {action, disabled, icon, activeStatus, commit, showPassword, title, size = 'big'}: Props = $props();

  const width = size === 'big' ? 'w-8 h-8' : 'w-4 h-4';
</script>

<Tooltip tip={title} nowrap={true}>
  <button {disabled} class="group {commit && activeStatus && 'primary-color'}" type="button" onclick={action}>
    {#if commit && activeStatus}
      <CheckmarkIcon className={width + ' fill-primary-600 stroke-none'} />
    {:else}
      {@const SvelteComponent = icon}
      <SvelteComponent {showPassword} fill={true} className={width + ' stroke-neutral-300 ' + (disabled && 'cursor-not-allowed')} />
    {/if}
  </button>
</Tooltip>

<style lang="postcss">
  @reference "tailwindcss";

  button {
    @apply w-fit cursor-pointer rounded-lg border-2 border-neutral-300/75 p-1 max-sm:scale-90;
    @apply !bg-none !shadow-transparent transition-none hover:bg-neutral-300/10;
  }

  .primary-color {
    @apply border-primary-600 hover:border-primary-600;
  }
</style>
