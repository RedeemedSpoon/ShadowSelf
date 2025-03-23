<script lang="ts">
  import type {FetchAPI} from '$type';
  import {identity} from '$store';
  import {formatDate} from '$lib';

  let {message}: {message: FetchAPI['messages'][number]} = $props();

  const ownMessage = message.from === $identity.phone;
</script>

<div class:own={ownMessage} class="relative flex items-center justify-between rounded-3xl bg-[#0b1225] px-8 py-6">
  <span id="bubble" class=" {ownMessage ? 'right-6' : 'left-6'} bg-[#0b1225]"></span>
  <p class="text-right text-neutral-300">{message.body}</p>
  <div class="h-full w-fit self-center text-sm text-neutral-500">
    {formatDate(message.date)}
  </div>
</div>

<style lang="postcss">
  #bubble {
    @apply absolute -bottom-2 -z-10 h-12 w-20 rotate-[-20deg] rounded-lg;
  }

  .own {
    @apply flex-row-reverse bg-[#141d2f];
  }

  .own span {
    @apply !rotate-[20deg] bg-[#141d2f];
  }
</style>
