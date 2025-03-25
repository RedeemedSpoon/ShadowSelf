<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, ReplyIcon, InboxIcon, BackIcon} from '$icon';
  import ConversationLists from './sub-components/ConversationLists.svelte';
  import ComposeMessage from './sub-components/ComposeMessage.svelte';
  import Conversation from './sub-components/Conversation.svelte';
  import {fetchAPI, formatPhoneNumber, notify} from '$lib';
  import {writable, type Writable} from 'svelte/store';
  import {identity, handleResponse} from '$store';
  import {ActionIcon, Loader} from '$component';
  import {conversation} from '$image';

  let {ws, token}: IdentityComponentParams = $props();

  let messages = $state() as FetchAPI;

  let fullDiscussion: Writable<FetchAPI['messages']> = writable([]);
  const mode: Writable<'browse' | 'read' | 'write' | 'reply'> = writable('browse');
  const discussion: Writable<FetchAPI['messages'][number] | undefined> = writable();

  async function fetchMessages() {
    await new Promise((resolve) => setTimeout(resolve, 350));
    document.getElementById('hold-load')?.remove();
    messages = await fetchAPI('/api/phone/' + $identity.id, token);
  }

  function deleteMessage() {
    const addressee = $discussion?.from === $identity.phone ? $discussion?.to : $discussion?.from;
    ws.send(JSON.stringify({type: 'delete-message', addressee}));
  }

  $handleResponse = (response: WebSocketResponse) => {
    switch (response.type) {
      case 'new-message': {
        notify('New Message Received!', 'success');

        const sender = response.newMessage?.from;
        const alreadyExists = messages.messages!.findIndex((msg) => msg.from === sender || msg.to === sender);

        if (alreadyExists !== -1) {
          messages.messages![alreadyExists] = response.newMessage!;

          if (($mode === 'read' || $mode === 'reply') && ($discussion?.from === sender || $discussion?.to === sender)) {
            $discussion = response.newMessage;
            $fullDiscussion = [response.newMessage!, ...$fullDiscussion];
          }
          return;
        }

        messages.messages!.unshift(response.newMessage!);
        break;
      }

      case 'send-message': {
        $mode = 'read';
        $discussion = response.messageSent;

        if (response.isReply) {
          const index = messages.messages.findIndex((msg) => msg.from === response.addressee || msg.to === response.addressee);
          if (index !== -1) messages.messages.splice(index, 1);

          if ($fullDiscussion.find((msg) => msg.from === response.addressee || msg.to === response.addressee)) {
            $fullDiscussion = [response.messageSent!, ...$fullDiscussion];
          } else {
            $fullDiscussion = [response.messageSent!];
            setTimeout(() => ws.send(JSON.stringify({type: 'fetch-conversation', addressee: response.addressee})), 300);
          }
        } else $fullDiscussion = [];

        messages.messages!.unshift(response.messageSent!);
        break;
      }

      case 'delete-message': {
        const index = messages.messages.findIndex((msg) => msg.from === response.addressee || msg.to === response.addressee);
        if (index !== -1) messages.messages.splice(index, 1);

        $discussion = undefined;
        $fullDiscussion = [];
        $mode = 'browse';
        break;
      }

      case 'fetch-conversation':
        $fullDiscussion = response.conversation!;
        break;
    }
  };
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-5xl font-bold text-neutral-300">Phone Number</h1>
  <div class="flex gap-1">
    {#if $mode === 'reply'}
      <ActionIcon icon={BackIcon} action={() => ($mode = 'read')} title="Cancel" />
    {/if}
    <ActionIcon icon={InboxIcon} action={() => (($mode = 'browse'), ($discussion = undefined))} title="Go to Messages" />
    <ActionIcon icon={SendIcon} action={() => (($mode = 'write'), ($discussion = undefined))} title="Start New Conversation" />
    <ActionIcon disabled={!$discussion} icon={ReplyIcon} action={() => ($mode = 'reply')} title="Reply to Message" />
    <ActionIcon disabled={!$discussion} icon={TrashIcon} action={deleteMessage} title="Delete Whole Conversation" />
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
      <div class="mt-20 flex w-full flex-col items-center">
        <div class="mb-4 flex w-full justify-between">
          <h3 class="text-3xl">{formatPhoneNumber($identity.phone)}</h3>
          <p class="text-neutral-500">{messages.messages.length} Conversations</p>
        </div>
        <ConversationLists {mode} {fullDiscussion} {discussion} messages={messages.messages} {ws} />
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

{#if $mode === 'write'}
  <ComposeMessage {ws} messages={messages.messages} />
{/if}

{#if $mode === 'read' || $mode === 'reply'}
  <Conversation {discussion} {ws} isReply={$mode === 'reply'} {fullDiscussion} />
{/if}

<style lang="postcss">
  #no-messages {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  h3 {
    @apply text-5xl text-neutral-300;
  }
</style>
