<script lang="ts">
  import {formatPhoneNumber, formatDate, toTitleCase} from '$format';
  import type {Writable} from 'svelte/store';
  import type {Message} from '$type';
  import {identity} from '$store';
  import {fetchAPI} from '$fetch';
  import {notify} from '$lib';

  interface Props {
    mode: Writable<'browse' | 'read' | 'write' | 'reply'>;
    discussion: Writable<Message | undefined>;
    fullDiscussion: Writable<Message[]>;
    messages: Message[];
  }

  let {messages, discussion, fullDiscussion, mode}: Props = $props();

  async function loadConversation(message: Message, addressee: string) {
    $fullDiscussion = [];
    $discussion = message;
    $mode = 'read';

    const response = await fetchAPI('phone/fetch-conversation', 'GET', {addressee});
    if (response.err) return notify(response.err, 'alert');
    $fullDiscussion = response.conversation;
  }
</script>

{#each messages as message}
  {@const addressee = message.from === $identity.phone ? message.to : message.from}
  <div class="message" aria-hidden="true" onclick={() => loadConversation(message, addressee)}>
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
    <p class="text-[1rem] text-neutral-400 md:text-right">{formatPhoneNumber(addressee)}</p>
  </div>
{/each}

<style lang="postcss">
  .message {
    @apply flex w-full justify-between border-b border-neutral-700 py-4 max-md:flex-col-reverse md:items-center md:px-8;
    @apply cursor-pointer select-none last:border-none hover:bg-neutral-300/5;
  }

  .status {
    @apply w-fit rounded-full bg-neutral-800/75 px-2 py-1 text-sm text-neutral-400;
  }
</style>
