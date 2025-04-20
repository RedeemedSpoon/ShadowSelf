<script lang="ts">
  import ComposeMessage from './ComposeMessage.svelte';
  import MessageComponent from './Message.svelte';
  import type {APIResponse, Message} from '$type';
  import type {Writable} from 'svelte/store';
  import {formatPhoneNumber} from '$format';
  import {identity} from '$store';

  interface Props {
    fullDiscussion: Writable<Message[]>;
    discussion: Writable<Message | undefined>;
    mode: Writable<'browse' | 'read' | 'write' | 'reply'>;
    messages: APIResponse;
  }

  let {discussion, fullDiscussion, mode, messages}: Props = $props();

  const addressee = $discussion?.from === $identity.phone ? $discussion?.to : $discussion?.from;
</script>

<div class="my-8 flex w-full flex-col items-center justify-center gap-2 text-lg text-neutral-600">
  <p id="box">Addressee is {formatPhoneNumber(addressee!)}</p>
  {#if $mode === 'reply'}
    <ComposeMessage {discussion} {fullDiscussion} {mode} {messages} />
  {/if}
  <div class="flex w-full flex-col gap-12">
    {#key $fullDiscussion}
      {#each $fullDiscussion as message}
        <MessageComponent {message} />
      {/each}
      {#if $fullDiscussion.length === 0}
        <MessageComponent message={$discussion!} />
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
