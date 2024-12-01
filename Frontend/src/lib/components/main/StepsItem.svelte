<script lang="ts">
  import {currentStep, isFetching} from '$store';
  import type {Snippet} from 'svelte';
  import {enhance} from '$app/forms';
  import {Card} from '$component';

  interface Props {
    shouldWait?: boolean;
    backStep: () => void;
    children: Snippet;
    action: string;
    index: number;
  }

  const {shouldWait = false, backStep, children, index, action}: Props = $props();

  const sendFrom = async () => {
    isFetching.set(true);
    if (shouldWait) await new Promise((resolve) => setTimeout(resolve, 750));

    return async ({update}: {update: (arg0: {reset: boolean}) => void}) => {
      isFetching.set(false);
      update({reset: false});
    };
  };
</script>

{#if $currentStep === index}
  <Card upperClass="w-fit flex self-center">
    {#if index !== 1}
      <button class="alt group" type="button" onclick={backStep}>← Back<span></span></button>
    {/if}
    <form method="POST" action="?/{action}" use:enhance={sendFrom}>
      {@render children?.()}
    </form>
  </Card>
{/if}

<style lang="postcss">
  form {
    @apply flex flex-col items-end gap-4 px-8 py-12 md:gap-8 md:p-16;
  }

  button {
    @apply z-10 -mb-8 ml-0 mt-4 w-fit text-left md:ml-9 md:mt-9;
  }

  span {
    @apply basic-style block h-[2px] max-w-0 transition-all duration-300 ease-in-out group-hover:!max-w-full;
  }
</style>
