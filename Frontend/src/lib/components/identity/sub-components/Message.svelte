<script lang="ts">
  import {formatDate, toTitleCase} from '$lib';
  import type {FetchAPI} from '$type';
  import {identity} from '$store';

  let {message}: {message: FetchAPI['messages'][number]} = $props();

  const ownMessage = message.from === $identity.phone;
</script>

<article class:own={ownMessage}>
  <span id="bubble" class=" {ownMessage ? 'right-6' : 'left-6'} bg-[#0b1225]"></span>
  <p class="whitespace-pre-line text-right text-neutral-300">
    {message.body}
  </p>
  <div class:text-right={!ownMessage} class="h-full w-fit self-center text-sm text-neutral-500">
    <span>{formatDate(message.date)}</span> <br />
    <span class="text-xs {!ownMessage ? 'text-neutral-700' : 'text-neutral-600'}">
      {toTitleCase(message.status)}
    </span>
  </div>
</article>

<style lang="postcss">
  article {
    @apply relative flex items-center justify-between rounded-3xl bg-[#0b1225] px-8 py-6;
  }

  #bubble {
    @apply absolute -bottom-2 -z-10 h-12 w-20 rotate-[-20deg] rounded-lg;
  }

  .own {
    @apply flex-row-reverse bg-[#141d2f];
  }

  .own > span {
    @apply !rotate-[20deg] bg-[#141d2f];
  }
</style>
