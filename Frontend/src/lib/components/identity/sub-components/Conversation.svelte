<script lang="ts">
  import {type Writable} from 'svelte/store';
  import Message from './Message.svelte';
  import {formatPhoneNumber} from '$lib';
  import type {FetchAPI} from '$type';
  import {identity} from '$store';

  interface Props {
    mode: Writable<'browse' | 'read' | 'write'>;
    discussion: FetchAPI['messages'][number];
    fullDiscussion: FetchAPI['messages'];
    ws: WebSocket;
  }

  let {discussion, fullDiscussion, ws, mode}: Props = $props();
  const addressee = discussion?.from === $identity.phone ? discussion?.to : discussion?.from;
</script>

<div class="my-8 flex w-full flex-col items-center justify-center gap-2 text-lg text-neutral-600">
  <p id="box">Addressee is {formatPhoneNumber(addressee)}</p>
  <div class="mt-8 flex w-full flex-col gap-8">
    <Message message={discussion} />
    <Message message={discussion} />
    <Message message={discussion} />
    <Message message={discussion} />
  </div>
</div>

<style lang="postcss">
  #box {
    @apply w-fit rounded-full bg-neutral-800/75 px-2 py-1 text-sm text-neutral-500 transition duration-300;
    @apply cursor-pointer ease-in-out hover:bg-neutral-800 hover:text-neutral-400/85;
  }
</style>
