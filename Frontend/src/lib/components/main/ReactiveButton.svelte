<script lang="ts">
  import type {Component} from 'svelte';
  import {CheckmarkIcon} from '$icon';

  interface Props {
    callback: () => void;
    newText?: string;
    isBox?: boolean;
    icon: Component;
    text: string;
  }

  const {callback, icon, text, newText, isBox}: Props = $props();

  let button = $state() as HTMLButtonElement;
  let buttonText = $state() as HTMLParagraphElement;
  let isActivated = $state();

  function handleClick() {
    callback();
    isActivated = true;
    buttonText.innerText = newText ? newText : text;

    setTimeout(() => {
      buttonText.innerText = text;
      isActivated = false;
    }, 2000);
  }
</script>

<button bind:this={button} type="button" onclick={handleClick} class={isBox ? 'box' : 'alt'}>
  <div>
    {#if icon}
      {@const SvelteComponent = isActivated ? CheckmarkIcon : icon}
      <SvelteComponent />
    {/if}
  </div>
  <p class:mono={isBox} bind:this={buttonText}>{isActivated ? newText : text}</p>
</button>

<style lang="postcss">
  button {
    @apply flex items-center gap-2;
  }

  .box {
    @apply from-neutral-900 to-neutral-800 shadow-inner;
  }

  .mono {
    @apply font-mono font-medium tracking-wider max-md:break-all;
  }

  p {
    @apply text-nowrap;
  }
</style>
