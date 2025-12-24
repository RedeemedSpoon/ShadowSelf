<script lang="ts">
  import type {Snippet} from 'svelte';
  import {enhance} from '$app/forms';
  import {currentStep} from '$store';
  import {updateFetch} from '$lib';
  import {Card} from '$component';

  interface Props {
    shouldWait?: boolean;
    backStep: () => void;
    children: Snippet;
    action: string;
    index: number;
    name?: string;
  }

  const {backStep, children, shouldWait, index, action, name}: Props = $props();
</script>

{#if $currentStep === index}
  <Card upperClass="w-fit flex self-center">
    {#if index !== 1}
      <button class="alt group" type="button" onclick={backStep}>← Back<span></span></button>
    {/if}
    <form method="POST" action="?/{action}" {name} use:enhance={() => updateFetch(shouldWait)}>
      {@render children?.()}
    </form>
  </Card>
{/if}

<style lang="postcss">
  @reference "$style";

  form {
    @apply flex flex-col items-end gap-4 px-8 py-12 md:gap-8 md:p-16;
  }

  button {
    @apply z-10 mt-4 -mb-8 ml-0 w-fit text-left md:mt-9 md:ml-9;
  }

  span {
    @apply basic-style block h-[2px] max-w-0 transition-all duration-300 ease-in-out group-hover:!max-w-full;
  }
</style>
