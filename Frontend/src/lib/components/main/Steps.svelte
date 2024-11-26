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
    <section
      class="mx-auto flex h-fit w-1/3 justify-center gap-12 pb-[10rem] pt-[15rem]"
      in:fly={{delay: 500, x: 100, opacity: 0, duration: 500}}
      out:fly={{x: -100, opacity: 0, duration: 500}}>
      {@render children?.()}
    </section>
  {/key}
</div>
