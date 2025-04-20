<script lang="ts">
  import type {Snippet} from 'svelte';
  import {cn} from '$cn';

  interface Props {
    className: string;
    children?: Snippet;
  }

  let {className, children}: Props = $props();
</script>

<div class={cn('h-96 w-96 [transform-style:preserve-3d]  [&>*]:[transform-style:preserve-3d]', className)}>
  {@render children?.()}
</div>
