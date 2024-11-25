<script lang="ts">
  import {onMount, type Snippet} from 'svelte';
  import {circuitPattern} from '$image';
  import {fly} from 'svelte/transition';
  import {currentStep} from '$store';

  let {children}: {children: Snippet} = $props();
  onMount(() => currentStep.set(1));
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
