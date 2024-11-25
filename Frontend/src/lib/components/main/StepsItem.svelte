<script lang="ts">
  import {currentStep} from '$store';
  import type {Snippet} from 'svelte';
  import {enhance} from '$app/forms';
  import {Card} from '$component';

  interface Props {
    backStep: () => void;
    children: Snippet;
    action: string;
    index: number;
  }

  const {backStep, children, index, action}: Props = $props();
</script>

{#if $currentStep === index}
  <Card upperClass="w-fit flex self-center">
    {#if index !== 1}
      <button class="alt z-10 -mb-8 ml-8 mt-8 text-left" type="button" onclick={backStep}>← Back</button>
    {/if}
    <form method="POST" action="?/{action}" use:enhance>
      {@render children?.()}
    </form>
  </Card>
{/if}

<style lang="postcss">
  form {
    @apply flex flex-col items-end gap-8 p-16;
  }
</style>
