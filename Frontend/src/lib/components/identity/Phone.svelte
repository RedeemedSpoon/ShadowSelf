<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import {ActionIcon, Loader} from '$component';
  import {conversation} from '$image';
  import {identity} from '$store';
  import {fetchAPI} from '$lib';

  let {ws, token}: IdentityComponentParams = $props();
  let inbox = $state() as FetchAPI;

  async function fetchMessages() {
    await new Promise((resolve) => setTimeout(resolve, 350));
    document.getElementById('hold-load')?.remove();

    inbox = await fetchAPI('/api/phone/' + $identity.id, token);
    console.log(inbox);
  }
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-5xl font-bold text-neutral-300">Phone Number</h1>
  <div class="flex gap-1">
    <ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" />
    <ActionIcon icon={SendIcon} action={() => {}} title="Send Messages" />
    <ActionIcon icon={TrashIcon} action={() => {}} title="Delete Messages" />
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
  {#if inbox?.receivedMessages.length || inbox?.sentMessages.length}
    {#each [...inbox.receivedMessages, ...inbox.sentMessages] as message}
      <div class="border-b border-neutral-700 px-8 py-4 last:border-none hover:bg-neutral-300/10">
        <p class="text-sm text-neutral-500">{message.date}</p>
        <p>{message.body}</p>
      </div>
    {/each}
  {:else}
    <section id="no-messages" style="background-image: url({conversation});">
      <h2 class="mt-12 text-5xl text-neutral-300">No Messages</h2>
      <p class="w-1/2 text-center">
        No messages have been sent to this number yet. Sending a quick text or starting a conversation to get things rolling could be a
        good first step!
      </p>
      <button>Start Conversation</button>
    </section>
  {/if}
{/await}

<style lang="postcss">
  #no-messages {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  h3 {
    @apply text-5xl text-neutral-300;
  }
</style>
