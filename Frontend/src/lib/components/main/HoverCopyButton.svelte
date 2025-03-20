<script lang="ts">
  import {CheckmarkIcon, CopyIcon} from '$icon';
  import type {Component} from 'svelte';

  interface Props {
    direction?: 'end' | 'start';
    size?: 'big' | 'small';
    icon: Component;
    color?: string;
    text?: string;
    id?: string;
  }

  const {icon, text, color, id, size = 'big', direction = 'start'}: Props = $props();

  let button = $state() as HTMLButtonElement;
  let buttonText = $state() as HTMLParagraphElement;

  let isActivated = $state();
  let isHovered = $state();

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text || buttonText.innerText);
    isActivated = true;

    setTimeout(() => (isActivated = false), 1000);
  }
</script>

<button
  bind:this={button}
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
  class={color + ' ' + (direction === 'end' ? 'flex-row-reverse self-end' : '')}
  onclick={handleClick}>
  {#if icon}
    {@const SvelteComponent = isActivated ? CheckmarkIcon : isHovered ? CopyIcon : icon}
    <SvelteComponent className="{size === 'big' ? 'w-6 h-6' : 'w-4 h-4'} {isHovered && !isActivated && '!fill-none'}" />
  {/if}
  <p bind:this={buttonText} {id} class={size === 'big' ? '!text-xl' : '!text-sm'}>{text}</p>
</button>

<style lang="postcss">
  button {
    @apply alt flex w-fit items-center gap-2 py-0.5;
  }

  p {
    @apply overflow-hidden md:text-nowrap;
  }
</style>
