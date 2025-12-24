<script lang="ts">
  import {SendIcon, TrashIcon, ReplyIcon, InboxIcon, BackIcon} from '$icon';
  import ConversationLists from './sub-components/ConversationLists.svelte';
  import ComposeMessage from './sub-components/ComposeMessage.svelte';
  import type {WebSocketMessage, APIResponse, Message} from '$type';
  import Conversation from './sub-components/Conversation.svelte';
  import {writable, type Writable} from 'svelte/store';
  import {identity, handleResponse} from '$store';
  import {ActionIcon, Loader} from '$component';
  import {formatPhoneNumber} from '$format';
  import {conversation} from '$image';
  import {fetchAPI} from '$fetch';
  import {notify} from '$lib';

  let messages = $state() as APIResponse;

  let fullDiscussion: Writable<Message[]> = writable([]);
  const mode: Writable<'browse' | 'read' | 'write' | 'reply'> = writable('browse');
  const discussion: Writable<Message | undefined> = writable();

  async function fetchMessages() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    document.getElementById('hold-load')?.remove();
    messages = await fetchAPI('phone', 'GET');
  }

  async function deleteMessage() {
    const addressee = $discussion?.from === $identity.phone ? $discussion?.to : $discussion?.from;
    const response = await fetchAPI('phone/delete-conversation', 'DELETE', {addressee});
    if (response.err) return notify(response.err, 'alert');

    const index = messages.messages.findIndex((msg) => msg.from === response.addressee || msg.to === response.addressee);
    if (index !== -1) messages.messages.splice(index, 1);

    $discussion = undefined;
    $fullDiscussion = [];
    $mode = 'browse';
  }

  $handleResponse = (response: WebSocketMessage) => {
    if (response.type !== 'message') return;
    notify('New Message Received!', 'success');

    const sender = response.message.from;
    const alreadyExists = messages.messages.findIndex((msg) => msg.from === sender || msg.to === sender);

    if (alreadyExists === -1) messages.messages.unshift(response.message!);
    else messages.messages[alreadyExists] = response.message!;

    if (($mode === 'read' || $mode === 'reply') && ($discussion?.from === sender || $discussion?.to === sender)) {
      $fullDiscussion = [response.message, ...$fullDiscussion];
      $discussion = response.message;
    }
  };
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-2xl font-bold text-neutral-300 sm:text-4xl md:text-5xl">Phone Number</h1>
  <div class="grid gap-1 max-md:grid-cols-3 md:grid-flow-col">
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
        <div class="mb-4 flex w-full justify-between max-md:flex-col">
          <h3 class="text-2xl! lg:text-3xl!">{formatPhoneNumber($identity.phone)}</h3>
          <p class="text-neutral-500">{messages.messages.length} Conversations</p>
        </div>
        <ConversationLists {mode} {fullDiscussion} {discussion} messages={messages.messages} />
      </div>
    {:else if $mode === 'browse'}
      <section id="no-messages" style="background-image: url({conversation});">
        <h2 class="mt-12 text-5xl text-neutral-300">No Messages</h2>
        <p class="text-center md:w-1/2">
          No messages have been sent to this number yet. Sending a quick text or starting a conversation to get things rolling could be
          a good first step!
        </p>
        <button>Start Conversation</button>
      </section>
    {/if}
  {/key}
{/await}

{#if $mode === 'write'}
  <ComposeMessage {discussion} {fullDiscussion} {mode} {messages} />
{/if}

{#if $mode === 'read' || $mode === 'reply'}
  <Conversation {discussion} {mode} {messages} {fullDiscussion} />
{/if}

<style lang="postcss">
  @reference "$style";

  #no-messages {
    @apply mt-12 mb-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  h3 {
    @apply text-5xl text-neutral-300;
  }
</style>
