<script lang="ts">
  import type {FetchAPI} from '$type';
  import {identity} from '$store';
  import {notify} from '$lib';

  interface Props {
    reply?: FetchAPI['messages'][number] | undefined;
    messages?: FetchAPI['messages'];
    ws: WebSocket;
  }

  let {ws, messages, reply}: Props = $props();

  let charLimit = $state(160) as number;
  let showButton = $state(true) as boolean;
  let secondStep = $state(false) as boolean;
  let textarea = $state() as HTMLTextAreaElement;
  let body = $state('') as string;
  let addressee = '';

  const title = $derived(secondStep ? 'Choose Your Recipient' : 'Type Your Message');
  const hint = $derived(secondStep ? 'Full phone number, with country code (e.g. +11234567890)' : `${charLimit} characters left`);
  const placeholder = $derived(secondStep ? 'Recipient' : 'Message Body');

  function handleInput(e: Event) {
    const event = e as unknown as KeyboardEvent;
    const textarea = event.target as HTMLTextAreaElement;

    charLimit = 160 - textarea.value.length;
    if (charLimit < 0) charLimit = 0;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;

    if (textarea.scrollHeight > 320) {
      textarea.style.height = '320px';
    }

    if (textarea.scrollHeight !== Number(textarea.style.height.slice(0, -2))) {
      if (Number(textarea.style.height.slice(0, -2)) < 120 && !textarea.value.includes('\n')) {
        textarea.style.height = '80px';
      }
    }
  }

  function sendMessage() {
    if (charLimit === 160) {
      notify('Please enter the message body', 'alert');
      return;
    }

    if (charLimit === 0) {
      notify('Message is too long (<160 characters)', 'alert');
      return;
    }

    if (reply) {
      body = textarea.value;
      addressee = $identity.phone === reply.from ? reply.to : reply.from;
    }

    if (!reply && !secondStep) {
      body = textarea.value;
      textarea.value = '';
      secondStep = true;
      return;
    }

    if (!addressee) addressee = textarea.value.replace(/ /g, '').replace(/-/g, '');
    const isReply = !!reply || messages?.find((message) => message.from === addressee || message.to === addressee);
    ws.send(JSON.stringify({type: 'send-message', body, addressee, isReply}));
  }
</script>

<div class:reply={!!reply} class="flex min-h-[50vh] w-full flex-col items-center justify-center gap-8">
  {#if reply}
    {@const body = reply.body.length > 45 ? reply.body.slice(0, 45).trim() + '...' : reply.body}
    <p class="ml-8 text-sm text-neutral-300">
      &#8625 Replying to : <span class="text-neutral-500"> {body}</span>
    </p>
  {:else}
    <h3>{title}</h3>
  {/if}
  <div class="relative {reply ? 'w-full' : 'w-3/4'}">
    <textarea
      bind:this={textarea}
      oninput={handleInput}
      onfocusin={() => (showButton = false)}
      onfocusout={() => (showButton = true)}
      {placeholder}></textarea>
    <button class:hidden={!showButton} onclick={sendMessage} id="send">→</button>
  </div>
  <small class:ml-8={!!reply} class={charLimit === 0 ? 'text-red-500' : 'text-neutral-500'}>{hint}</small>
</div>

<style lang="postcss">
  h3 {
    @apply text-5xl text-neutral-300;
  }

  .reply {
    @apply min-h-fit items-start gap-2;
  }

  textarea {
    @apply no-scrollbar h-[80px] w-full resize-none rounded-3xl px-8 py-6 !transition-colors;
  }

  #send {
    @apply alt rounded-full border-2 border-neutral-500 px-3 py-2 text-2xl font-bold text-neutral-500;
    @apply absolute right-8 top-4 cursor-pointer bg-neutral-800 opacity-70 hover:opacity-100;
    @apply transition-all duration-300 ease-in-out hover:text-neutral-500;
  }
</style>
