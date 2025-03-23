<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, ReplyIcon, InboxIcon} from '$icon';
  import {fetchAPI, formatPhoneNumber, notify} from '$lib';
  import {writable, type Writable} from 'svelte/store';
  import {identity, handleResponse} from '$store';
  import {ActionIcon, Loader} from '$component';
  import {conversation} from '$image';

  let {ws, token}: IdentityComponentParams = $props();
  let messages = $state() as FetchAPI;

  const discussion: Writable<FetchAPI['messages'] | null> = writable();
  const mode: Writable<'browse' | 'converse' | 'write' | 'reply'> = writable('browse');

  async function fetchMessages() {
    await new Promise((resolve) => setTimeout(resolve, 350));
    document.getElementById('hold-load')?.remove();
    messages = await fetchAPI('/api/phone/' + $identity.id, token);
  }

  function deleteMessage() {
    ws.send(JSON.stringify({type: 'delete-message'}));
  }

  $handleResponse = (response: WebSocketResponse) => {
    switch (response.type) {
      case 'new-message':
        notify('New Message Received!', 'success');
        $discussion!.unshift(response.newMessage!);
        break;

      case 'delete-message':
        $discussion = $discussion!.filter((message) => message.messageID !== response.sid);
        break;
    }
  };
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-5xl font-bold text-neutral-300">Phone Number</h1>
  <div class="flex gap-1">
    <ActionIcon icon={InboxIcon} action={() => ($mode = 'browse')} title="Go to Inbox" />
    <ActionIcon icon={SendIcon} action={() => ($mode = 'write')} title="Send Message" />
    <ActionIcon disabled={!$discussion} icon={ReplyIcon} action={() => ($mode = 'reply')} title="Reply to Message" />
    <ActionIcon disabled={!$discussion} icon={TrashIcon} action={deleteMessage} title="Delete Message" />
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
  {#key messages.messages}
    {#if $mode === 'browse' && messages?.messages?.length}
      <div class="mt-[5vh] flex items-center justify-between">
        <h3 class="!text-3xl">{formatPhoneNumber($identity.phone)}</h3>
        <p class="text-neutral-500">{messages.messages.length} Conversations</p>
      </div>
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

  h3 {
    @apply text-5xl text-neutral-300;
  }
</style>
