<script lang="ts">
  import {type Writable} from 'svelte/store';
  import {formatPhoneNumber} from '$lib';
  import type {FetchAPI} from '$type';
  import {identity} from '$store';

  interface Props {
    mode: Writable<'browse' | 'read' | 'write' | 'reply'>;
    target: Writable<FetchAPI['sentMessages'][number] | null>;
    firstime: boolean;
    ws: WebSocket;
  }

  let {ws, firstime = true, mode, target}: Props = $props();
</script>

{#if $mode === 'read' && $target}
  {@const ownMessage = $target.from === $identity.phone}
  {#if firstime}
    <div class="my-8 flex w-full items-center justify-center gap-2 text-lg text-neutral-600">
      {ownMessage ? 'Receiver is ' : 'Sender is '}
      <p id="box">
        {formatPhoneNumber(ownMessage ? $target.to : $target.from)}
      </p>
    </div>
  {/if}
  <div class:own={ownMessage} class="relative flex justify-between rounded-3xl bg-[#0b1225] px-8 py-6">
    <span id="bubble" class=" {ownMessage ? 'right-6' : 'left-6'} bg-[#0b1225]"></span>
    <p class="text-right text-neutral-300">{$target.body}</p>
    <div class="h-full w-fit self-center text-sm text-neutral-500">
      {#if new Date($target.date).toLocaleString().split(', ')[0] !== new Date().toLocaleString().split(', ')[0]}
        {new Date($target.date).toLocaleString().split(', ')[0]}
      {:else}
        {new Date($target.date).toLocaleString().split(', ')[1]}
      {/if}
    </div>
  </div>
{/if}

<style lang="postcss">
  #box {
    @apply w-fit rounded-full bg-neutral-800/75 px-2 py-1 text-sm text-neutral-500 transition duration-300;
    @apply cursor-pointer ease-in-out hover:bg-neutral-800 hover:text-neutral-400;
  }

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
