<script lang="ts">
  import type {Snippet} from 'svelte';
  import {cn} from '$cn';

  interface Props {
    className?: string | undefined;
    translateX?: number | string | undefined;
    translateY?: number | string | undefined;
    translateZ?: number | string | undefined;
    rotateX?: number | undefined;
    rotateY?: number | undefined;
    rotateZ?: number | undefined;
    isMouseEntered?: boolean;
    children?: Snippet;
  }

  let {
    className = undefined,
    translateX = $bindable(0),
    translateY = $bindable(0),
    translateZ = $bindable(0),
    rotateX = $bindable(0),
    rotateY = $bindable(0),
    rotateZ = $bindable(0),
    isMouseEntered = $bindable(false),
    children,
    ...rest
  }: Props = $props();

  let ref: HTMLDivElement | undefined = $state();
  $effect(() => {
    if (isMouseEntered) handleAnimations();
  });

  const handleAnimations = () => {
    if (!ref) return;
    if (isMouseEntered) {
      ref.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    } else {
      ref.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
    }
  };
</script>

<div bind:this={ref} class={cn('w-fit transition duration-200 ease-linear', className)} {...rest}>
  {@render children?.()}
</div>
