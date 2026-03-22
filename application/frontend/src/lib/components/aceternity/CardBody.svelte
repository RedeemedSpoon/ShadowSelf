<script lang="ts">
  import type {Snippet} from 'svelte';
  import {cn} from '$utils/cn';

  interface Props {
    className: string;
    children?: Snippet;
  }

  let {className, children}: Props = $props();
</script>

<div class={cn('h-96 w-96 transform-3d *:transform-3d', className)}>
  {@render children?.()}
</div>
