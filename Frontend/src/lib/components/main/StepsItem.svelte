<script lang="ts">
  import {Card} from '$components';
  import {currentStep} from '$store';
  import type {Snippet} from 'svelte';
  import {enhance} from '$app/forms';

  interface Props {
    children: Snippet;
    action: string;
    index: number;
  }

  const {children, index, action}: Props = $props();
</script>

{#if $currentStep === index}
  <Card upperClass="w-fit flex self-center">
    <form method="POST" action="?/{action}" use:enhance>
      {@render children?.()}
    </form>
  </Card>
{/if}

<style lang="postcss">
  form {
    @apply flex flex-col items-end gap-8 px-12 py-16;
  }
</style>
