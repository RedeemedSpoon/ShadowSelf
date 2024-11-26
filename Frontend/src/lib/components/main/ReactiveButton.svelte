<script lang="ts">
  import type {Component} from 'svelte';
  import {CheckmarkIcon} from '$icon';

  interface Props {
    icon: Component;
    text: string;
    newText: string;
    callback: () => void;
  }

  const {callback, icon, text, newText}: Props = $props();

  let button = $state() as HTMLButtonElement;
  let buttonText = $state() as HTMLParagraphElement;
  let isActivated = $state();

  function handleClick() {
    callback();
    isActivated = true;
    buttonText.innerText = newText;

    setTimeout(() => {
      buttonText.innerText = text;
      isActivated = false;
    }, 2000);
  }
</script>

<button bind:this={button} type="button" onclick={handleClick} class="alt flex items-center gap-2">
  <div>
    {#if icon}
      {@const SvelteComponent = isActivated ? CheckmarkIcon : icon}
      <SvelteComponent />
    {/if}
  </div>
  <p bind:this={buttonText}>{isActivated ? newText : text}</p>
</button>
