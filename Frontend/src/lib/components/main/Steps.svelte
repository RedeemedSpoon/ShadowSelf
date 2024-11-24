<script lang="ts">
  import {currentStep} from '$store';
  import type {Snippet} from 'svelte';
  import {fly} from 'svelte/transition';
  import {circuitPattern} from '$images';

  let {children}: {children: Snippet} = $props();
</script>

<div style="background-image: url({circuitPattern}); background-repeat: repeat">
  {#key $currentStep}
    <div
      class="gap-12; mx-auto flex h-screen w-1/3 justify-center"
      in:fly={{delay: 500, x: 100, opacity: 0, duration: 500}}
      out:fly={{x: -100, opacity: 0, duration: 500}}>
      {@render children?.()}
    </div>
  {/key}
</div>
