<script lang="ts">
  import {formatPhoneNumber, formatDate, toTitleCase} from '$lib';
  import {type Writable} from 'svelte/store';
  import {LoadingButton} from '$component';
  import type {FetchAPI} from '$type';
  import {identity} from '$store';

  interface Props {
    mode: Writable<'browse' | 'read' | 'write'>;
    discussion: Writable<FetchAPI['messages'][number] | undefined>;
    messages: FetchAPI['messages'];
    ws: WebSocket;
  }

  let {messages, discussion, ws, mode}: Props = $props();

  let from = $state(10);
  const className = 'bg-contain from-neutral-900 to-neutral-950/40 hover:text-neutral-400 py-7 w-full shadow-none';

  function handleClick(message: FetchAPI['messages'][number], addressee: string) {
    ws.send(JSON.stringify({type: 'fetch-conversation', addressee}));

    $discussion = message;
    $mode = 'read';
  }

  async function loadMore() {
    ws.send(JSON.stringify({type: 'load-more'}));
  }
</script>

{#each messages as message}
  {@const addressee = message.from === $identity.phone ? message.to : message.from}
  <div class="message" aria-hidden="true" onclick={() => handleClick(message, addressee)}>
    <div>
      <p class="text-neutral-300">{message.body.length > 45 ? message.body.slice(0, 45).trim() + '...' : message.body}</p>
      <div class="flex items-center gap-2 text-sm text-neutral-500">
        <div class="status">{toTitleCase(message.status)}</div>
        {formatDate(message.date)}
      </div>
    </div>
    <p class="text-right text-[1rem] text-neutral-400">{formatPhoneNumber(addressee)}</p>
  </div>
{/each}

{#key messages.length}
  {#if messages.length > from}
    <LoadingButton {className} onclick={loadMore}>Load More</LoadingButton>
  {/if}
{/key}

<style lang="postcss">
  .message {
    @apply flex w-full items-center justify-between border-b border-neutral-700 px-8 py-4;
    @apply cursor-pointer select-none last:border-none hover:bg-neutral-300/5;
  }

  .status {
    @apply w-fit rounded-full bg-neutral-800/75 px-2 py-1 text-sm text-neutral-400;
  }
</style>
