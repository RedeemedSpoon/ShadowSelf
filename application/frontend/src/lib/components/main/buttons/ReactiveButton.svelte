<script lang="ts">
  import type {Component} from 'svelte';
  import {CheckmarkIcon} from '$icon';

  interface Props {
    callback: () => void;
    upperClassname?: string;
    iconSvgClassname?: string;
    iconClassname?: string;
    className?: string;
    newText?: string;
    isBox?: boolean;
    icon: Component;
    text: string;
  }

  const {callback, icon, className, upperClassname, iconClassname, iconSvgClassname, text, newText, isBox}: Props = $props();

  let isActivated = $state();

  function handleClick() {
    callback();
    isActivated = true;
    setTimeout(() => (isActivated = false), 2000);
  }
</script>

<button type="button" onclick={handleClick} class="{upperClassname} {isBox ? 'box' : 'alt'}">
  <div class={iconClassname}>
    {#if icon}
      {@const SvelteComponent = isActivated ? CheckmarkIcon : icon}
      <SvelteComponent {...iconSvgClassname ? {className: iconSvgClassname} : {}} />
    {/if}
  </div>
  <p class="{className} {isBox ? 'mono' : ''}">{isActivated ? newText || text : text}</p>
</button>

<style lang="postcss">
  @reference "$style";

  button {
    @apply flex w-fit items-center gap-2;
  }

  .box {
    @apply from-neutral-900 to-[#1a2437] shadow-inner shadow-neutral-950/50;
  }

  .mono {
    @apply font-mono font-medium tracking-wider max-md:break-all;
  }

  p {
    @apply md:text-nowrap;
  }
</style>
