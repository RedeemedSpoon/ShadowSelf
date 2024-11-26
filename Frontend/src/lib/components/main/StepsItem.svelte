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

    return async ({update}: {update: () => Promise<void>}) => {
      isFetching.set(false);
      await update();
    };
  };
</script>

{#if $currentStep === index}
  <Card upperClass="w-fit flex self-center">
    {#if index !== 1}
      <button class="alt" type="button" onclick={backStep}>← Back</button>
    {/if}
    <form method="POST" action="?/{action}" use:enhance={sendFrom}>
      {@render children?.()}
    </form>
  </Card>
{/if}

<style lang="postcss">
  form {
    @apply flex flex-col items-end gap-8 p-16;
  }

  button {
    @apply z-10 -mb-8 ml-8 mt-8 text-left;
  }
</style>
