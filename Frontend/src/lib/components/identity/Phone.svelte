<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, ReplyIcon, InboxIcon} from '$icon';
  import {fetchAPI, formatPhoneNumber, notify} from '$lib';
  import {identity, handleResponse} from '$store';
  import {ActionIcon, Loader} from '$component';
  import {conversation} from '$image';

  let {ws, token}: IdentityComponentParams = $props();
  let messages = $state() as FetchAPI;
  let inbox = $state('all') as 'all' | 'received' | 'sent';

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

  $handleResponse = (response: WebSocketResponse) => {
    switch (response.type) {
      case 'new-message':
        notify('New Message Received!', 'success');
        messages.receivedMessages.unshift(response.newMessage!);
        break;
    }
  };
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-5xl font-bold text-neutral-300">Phone Number</h1>
  <div class="flex gap-1">
    <ActionIcon icon={InboxIcon} action={() => {}} title="Go to Inbox" />
    <ActionIcon icon={SendIcon} action={() => {}} title="Send Message" />
    <ActionIcon disabled icon={ReplyIcon} action={() => {}} title="Reply to Message" />
    <ActionIcon disabled icon={TrashIcon} action={() => {}} title="Delete Message" />
  </div>
</section>
<div id="hold-load" class="h-[40vh]"></div>
{#await fetchMessages()}
  <div class="flex h-[40vh] items-center justify-center">
    <h3 class="flex items-center gap-6">
      <Loader size="big" skip={true} />Fetching
    </h3>
  </div>
{:then}
  {#key messages.receivedMessages}
    {#if messages?.receivedMessages.length || messages?.sentMessages.length}
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
          <div class="border-b border-neutral-700 px-8 py-4 last:border-none hover:bg-neutral-300/10">
            <p class="text-sm text-neutral-500">{message.date}</p>
            <p>{message.body}</p>
          </div>
        {/each}
      {/key}
    {:else}
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
