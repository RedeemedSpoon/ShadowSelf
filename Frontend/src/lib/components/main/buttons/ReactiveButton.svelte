<script lang="ts">
  import type {Component} from 'svelte';
  import {CheckmarkIcon} from '$icon';

  interface Props {
    callback: () => void;
    upperClassname?: string;
    iconClassname?: string;
    className?: string;
    newText?: string;
    isBox?: boolean;
    icon: Component;
    text: string;
  }

  const {callback, icon, className, upperClassname, iconClassname, text, newText, isBox}: Props = $props();

  let button = $state() as HTMLButtonElement;
  let buttonText = $state() as HTMLParagraphElement;
  let isActivated = $state();

  function handleClick() {
    callback();
    isActivated = true;
    setTimeout(() => (isActivated = false), 2000);
  }
</script>

<button bind:this={button} type="button" onclick={handleClick} class="{upperClassname} {isBox ? 'box' : 'alt'}">
  <div class={iconClassname}>
    {#if icon}
      {@const SvelteComponent = isActivated ? CheckmarkIcon : icon}
      <SvelteComponent />
    {/if}
  </div>
  <p class="{className} {isBox ? 'mono' : ''}" bind:this={buttonText}>{isActivated ? newText || text : text}</p>
</button>

<style lang="postcss">
  button {
    @apply flex w-fit items-center gap-2;
  }

  .box {
    @apply from-neutral-900 to-[#1a2437] shadow-inner;
  }

  .mono {
    @apply font-mono font-medium tracking-wider max-md:break-all;
  }

  p {
    @apply md:text-nowrap;
  }
</style>
