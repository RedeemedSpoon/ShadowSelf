<script lang="ts">
  import ActionIcon from '$component/feedback/ActionIcon.svelte';
  import Loader from '$component/feedback/Loader.svelte';

  import BackIcon from '$icon/navigation/Back.svelte';
  import TrashIcon from '$icon/actions/Trash.svelte';
  import ReplyIcon from '$icon/actions/Reply.svelte';
  import SendIcon from '$icon/actions/Send.svelte';

  import ConversationLists from './ConversationLists.svelte';
  import ComposeMessage from './ComposeMessage.svelte';
  import Conversation from './Conversation.svelte';

  import conversation from '$image/empty-states/conversation.svg';
  import type {WebSocketMessage, PhoneAPI, Message} from '$type';
  import {writable, type Writable} from 'svelte/store';
  import {formatPhoneNumber} from '$utils/formating';
  import {identity, handleResponse} from '$store';
  import {fetchAPI} from '$utils/webfetch';
  import {notify} from '$utils/shared';

  let messages = $state() as PhoneAPI;

  let fullDiscussion: Writable<Message[]> = writable([]);
  const mode: Writable<'browse' | 'read' | 'write' | 'reply'> = writable('browse');
  const discussion: Writable<Message | undefined> = writable();

  async function fetchMessages() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    document.getElementById('hold-load')?.remove();
    messages = await fetchAPI<PhoneAPI>('phone', 'GET');
  }

  async function deleteMessage() {
    const addressee = $discussion?.from === $identity.phone ? $discussion?.to : $discussion?.from;
    const response = await fetchAPI<PhoneAPI>('phone/delete-conversation', 'DELETE', {addressee});
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
    {#if $mode !== 'browse'}
      <ActionIcon icon={BackIcon} action={() => (($mode = 'browse'), ($discussion = undefined))} title="Go Back to Messages" />
    {/if}
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
        <button onclick={() => ($mode = 'write')}>Start Conversation</button>
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
