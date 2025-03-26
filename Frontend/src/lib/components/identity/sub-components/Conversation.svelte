<script lang="ts">
  import ComposeMessage from './ComposeMessage.svelte';
  import type {Writable} from 'svelte/store';
  import Message from './Message.svelte';
  import {formatPhoneNumber} from '$lib';
  import type {FetchAPI} from '$type';
  import {identity} from '$store';

  interface Props {
    ws: WebSocket;
    isReply: boolean;
    discussion: Writable<FetchAPI['messages'][number] | undefined>;
    fullDiscussion: Writable<FetchAPI['messages']>;
  }

  let {discussion, fullDiscussion, ws, isReply}: Props = $props();

  const addressee = $discussion?.from === $identity.phone ? $discussion?.to : $discussion?.from;
</script>

<div class="my-8 flex w-full flex-col items-center justify-center gap-2 text-lg text-neutral-600">
  <p id="box">Addressee is {formatPhoneNumber(addressee!)}</p>
  {#if isReply}
    <ComposeMessage {ws} reply={$discussion} />
  {/if}
  <div class="flex w-full flex-col gap-12">
    {#key $fullDiscussion}
      {#each $fullDiscussion as message}
        <Message {message} />
      {/each}
      {#if $fullDiscussion.length === 0}
        <Message message={$discussion!} />
      {/if}
    {/key}
  </div>
</div>

<style lang="postcss">
  #box {
    @apply w-fit rounded-full bg-neutral-800/75 px-2 py-1 text-sm text-neutral-500 transition duration-300;
    @apply my-8 cursor-pointer ease-in-out hover:bg-neutral-800 hover:text-neutral-400/85;
  }
</style>
