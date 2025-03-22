<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, ReplyIcon, InboxIcon} from '$icon';
  import {fetchAPI, formatPhoneNumber, notify, toTitleCase} from '$lib';
  import {writable, type Writable} from 'svelte/store';
  import ComposeMessage from './ComposeMessage.svelte';
  import {identity, handleResponse} from '$store';
  import {ActionIcon, Loader} from '$component';
  import Message from './Message.svelte';
  import {conversation} from '$image';

  let {ws, token}: IdentityComponentParams = $props();
  let inbox = $state('all') as 'all' | 'received' | 'sent';
  let messages = $state() as FetchAPI;

  const target: Writable<FetchAPI['sentMessages'][number] | null> = writable();
  const mode: Writable<'browse' | 'read' | 'write' | 'reply'> = writable('browse');

  async function fetchMessages() {
    await new Promise((resolve) => setTimeout(resolve, 350));
    document.getElementById('hold-load')?.remove();

    messages = await fetchAPI('/api/phone/' + $identity.id, token);
  }

  function getMessages() {
    if (inbox === 'all') return messages.receivedMessages.concat(messages.sentMessages);
    else if (inbox === 'received') return messages.receivedMessages;
    else return messages.sentMessages;
  }

  function deleteMessage() {
    ws.send(JSON.stringify({type: 'delete-message', sid: $target!.messageID}));
  }

  $handleResponse = (response: WebSocketResponse) => {
    switch (response.type) {
      case 'new-message':
        notify('New Message Received!', 'success');
        messages.receivedMessages.unshift(response.newMessage!);
        break;

      case 'delete-message':
        messages.receivedMessages = messages.receivedMessages.filter((message) => message.messageID !== response.sid);
        messages.sentMessages = messages.sentMessages.filter((message) => message.messageID !== response.sid);
        $target = null;
        break;
    }
  };
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-5xl font-bold text-neutral-300">Phone Number</h1>
  <div class="flex gap-1">
    <ActionIcon icon={InboxIcon} action={() => ($mode = 'browse')} title="Go to Inbox" />
    <ActionIcon icon={SendIcon} action={() => ($mode = 'write')} title="Send Message" />
    <ActionIcon disabled={!$target} icon={ReplyIcon} action={() => ($mode = 'reply')} title="Reply to Message" />
    <ActionIcon disabled={!$target} icon={TrashIcon} action={deleteMessage} title="Delete Message" />
  </div>
</section>
<div id="hold-load" class="h-[40vh]"></div>
<Message {target} {mode} {ws} />
<ComposeMessage {target} {mode} {ws} />
{#await fetchMessages()}
  <div class="flex h-[40vh] items-center justify-center">
    <h3 class="flex items-center gap-6">
      <Loader size="big" skip={true} />Fetching
    </h3>
  </div>
{:then}
  {#key messages.receivedMessages}
    {#if $mode === 'browse' && (messages?.receivedMessages.length || messages?.sentMessages.length)}
      <div class="mt-[5vh] flex items-center justify-between">
        <div class="[*&>p]:!text-neutral-500">
          <h3 class="!text-3xl">{formatPhoneNumber($identity.phone)}</h3>
          {#if inbox === 'all'}
            <p>{messages.receivedMessages.length + messages.sentMessages.length} Total Messages</p>
          {:else if inbox === 'received'}
            <p>{messages.receivedMessages.length} Messages Received</p>
          {:else if inbox === 'sent'}
            <p>{messages.sentMessages.length} Messages Sent</p>
          {/if}
        </div>
        <div id="labels" class="flex">
          <button class:selected={inbox === 'all'} onclick={() => (inbox = 'all')}>All</button>
          <button class:selected={inbox === 'received'} onclick={() => (inbox = 'received')}>Received</button>
          <button class:selected={inbox === 'sent'} onclick={() => (inbox = 'sent')}>Sent</button>
        </div>
      </div>
      {#key inbox}
        {#each getMessages() as message}
          <div
            class="message"
            aria-hidden="true"
            class:target={message === $target}
            onclick={() => ($target === message ? ($mode = 'read') : ($target = message))}>
            <div>
              <p class="text-neutral-300">{message.body.length > 45 ? message.body.slice(0, 45).trim() + '...' : message.body}</p>
              <div class="flex items-center gap-2 text-sm text-neutral-500">
                <div class="status">{toTitleCase(message.status)}</div>
                {new Date(message.date).toLocaleString()}
              </div>
            </div>
            {#if message.from === $identity.phone}
              <p class="text-right text-[1rem] text-neutral-400">Sent to {formatPhoneNumber(message.to)}</p>
            {:else}
              <p class="text-right text-[1rem] text-neutral-400">Received from {formatPhoneNumber(message.from)}</p>
            {/if}
          </div>
        {/each}
      {/key}
    {:else if $mode === 'browse'}
      <section id="no-messages" style="background-image: url({conversation});">
        <h2 class="mt-12 text-5xl text-neutral-300">No Messages</h2>
        <p class="w-1/2 text-center">
          No messages have been sent to this number yet. Sending a quick text or starting a conversation to get things rolling could be
          a good first step!
        </p>
        <button>Start Conversation</button>
      </section>
    {/if}
  {/key}
{/await}

<style lang="postcss">
  #no-messages {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  .message {
    @apply flex items-center justify-between border-b border-neutral-700 px-8 py-4;
    @apply cursor-pointer select-none last:border-none hover:bg-neutral-300/5;
  }

  .target {
    @apply bg-neutral-300/10 hover:bg-neutral-300/10;
  }

  .status {
    @apply w-fit rounded-full bg-neutral-800/75 px-2 py-1 text-sm text-neutral-400;
  }

  h3 {
    @apply text-5xl text-neutral-300;
  }

  #labels button {
    @apply rounded-none bg-none shadow-none hover:bg-neutral-800/50 hover:bg-none;
    @apply cursor-pointer border border-neutral-800 bg-neutral-800/30 px-4 py-3 first:rounded-l-md last:rounded-r-md;
  }

  #labels button.selected {
    @apply bg-primary-600 text-neutral-300;
  }
</style>
