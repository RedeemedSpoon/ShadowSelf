<script lang="ts">
  import {formatPhoneNumber, formatDate, toTitleCase} from '$lib';
  import {type Writable} from 'svelte/store';
  import type {FetchAPI} from '$type';
  import {identity} from '$store';

  interface Props {
    mode: Writable<'browse' | 'read' | 'write' | 'reply'>;
    discussion: Writable<FetchAPI['messages'][number] | undefined>;
    fullDiscussion: Writable<FetchAPI['messages']>;
    messages: FetchAPI['messages'];
    ws: WebSocket;
  }

  let {messages, discussion, fullDiscussion, ws, mode}: Props = $props();

  function handleClick(message: FetchAPI['messages'][number], addressee: string) {
    ws.send(JSON.stringify({type: 'fetch-conversation', addressee}));

    $fullDiscussion = [];
    $discussion = message;
    $mode = 'read';
  }
</script>

{#each messages as message}
  {@const addressee = message.from === $identity.phone ? message.to : message.from}
  <div class="message" aria-hidden="true" onclick={() => handleClick(message, addressee)}>
    <div>
      <p class="text-neutral-300">
        <span class="text-neutral-600">{addressee === message.to ? ' (You)' : ''}</span>
        {message.body.length > 45 ? message.body.slice(0, 45).trim() + '...' : message.body}
      </p>
      <div class="flex items-center gap-2 text-sm text-neutral-500">
        <div class="status">{toTitleCase(message.status)}</div>
        {formatDate(message.date)}
      </div>
    </div>
    <p class="text-right text-[1rem] text-neutral-400">{formatPhoneNumber(addressee)}</p>
  </div>
{/each}

<style lang="postcss">
  .message {
    @apply flex w-full items-center justify-between border-b border-neutral-700 px-8 py-4;
    @apply cursor-pointer select-none last:border-none hover:bg-neutral-300/5;
  }

  .status {
    @apply w-fit rounded-full bg-neutral-800/75 px-2 py-1 text-sm text-neutral-400;
  }
</style>
