<script lang="ts">
  import type {APIResponse, Message} from '$type';
  import type {Writable} from 'svelte/store';
  import {fetchAPI} from '$fetch';
  import {identity} from '$store';
  import {notify} from '$lib';

  interface Props {
    mode: Writable<'browse' | 'read' | 'write' | 'reply'>;
    discussion: Writable<Message | undefined>;
    fullDiscussion: Writable<Message[]>;
    messages: APIResponse;
  }

  let {messages, mode, discussion, fullDiscussion}: Props = $props();

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

  async function sendMessage(isReply: boolean, body: {[key: string]: unknown}) {
    const response = await fetchAPI('phone/send-message', 'POST', body);
    if (response.err) return notify(response.err, 'alert');

    $mode = 'read';
    $discussion = response.messageSent;
    const addressee = response.addressee;

    if (isReply) {
      const index = messages?.messages.findIndex((msg) => msg.from === addressee || msg.to === addressee);
      if (index !== -1) messages?.messages.splice(index!, 1);

      if ($fullDiscussion.find((msg) => msg.from === addressee || msg.to === addressee)) {
        $fullDiscussion = [response.messageSent, ...$fullDiscussion];
      } else {
        $fullDiscussion = [response.messageSent];

        setTimeout(async () => {
          const response = await fetchAPI('phone/fetch-conversation', 'POST', {addressee});
          if (response.err) return notify(response.err, 'alert');
          $fullDiscussion = response.conversation;
        }, 300);
      }
    } else $fullDiscussion = [];

    messages?.messages.unshift(response.messageSent);
  }

  function next() {
    if (charLimit === 160) {
      notify('Please enter the message body', 'alert');
      return;
    }

    if (charLimit === 0) {
      notify('Message is too long (<160 characters)', 'alert');
      return;
    }

    if ($discussion) {
      body = textarea.value;
      addressee = $identity.phone === $discussion.from ? $discussion.to : $discussion.from;
    }

    if (!$discussion && !secondStep) {
      body = textarea.value;
      textarea.value = '';
      secondStep = true;
      return;
    }

    if (!addressee) addressee = textarea.value.replace(/ /g, '').replace(/-/g, '');
    const isReply = !!$discussion || !!messages?.messages.find((message) => message.from === addressee || message.to === addressee);
    sendMessage(isReply, {body, addressee});
  }
</script>

<div class:reply={!!$discussion} class="my-4 flex min-h-[50vh] w-full flex-col items-center justify-center gap-8">
  {#if $discussion}
    {@const body = $discussion.body.length > 45 ? $discussion.body.slice(0, 45).trim() + '...' : $discussion.body}
    <p class="ml-8 text-sm text-neutral-300">
      &#8625 Replying to: <span class="text-neutral-500">{body}</span>
    </p>
  {:else}
    <h3 class="text-center text-3xl text-neutral-300 md:text-5xl">{title}</h3>
  {/if}
  <div class="relative {$discussion ? 'w-full' : 'md:w-3/4'}">
    <textarea
      bind:this={textarea}
      oninput={handleInput}
      onfocusin={() => (showButton = false)}
      onfocusout={() => (showButton = true)}
      {placeholder}></textarea>
    <button class:hidden={!showButton} onclick={next} id="send">→</button>
  </div>
  <small class:ml-8={!!$discussion} class={charLimit === 0 ? 'text-red-500' : 'text-neutral-500'}>{hint}</small>
</div>

<style lang="postcss">
  @reference "$style";

  #send {
    @apply alt rounded-full border-2 border-neutral-500 px-3 py-2 text-2xl font-bold text-neutral-500;
    @apply absolute right-8 top-4 cursor-pointer bg-neutral-800 opacity-70 hover:opacity-100;
    @apply transition-all duration-300 ease-in-out hover:text-neutral-500;
  }

  .reply {
    @apply min-h-fit items-start gap-2;
  }

  textarea {
    @apply no-scrollbar h-[80px] w-full resize-none rounded-3xl px-8 py-6 !transition-colors;
  }
</style>
