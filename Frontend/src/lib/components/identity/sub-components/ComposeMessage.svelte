<script lang="ts">
  import type {FetchAPI} from '$type';
  import {SendIcon} from '$icon';

  interface Props {
    reply: FetchAPI['messages'][number] | undefined;
    ws: WebSocket;
  }

  let {ws, reply}: Props = $props();
  let charLimit = $state(160) as number;

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
</script>

<div class="flex min-h-[50vh] w-full flex-col items-center justify-center gap-8">
  <h3>Compose Message</h3>
  <textarea oninput={handleInput} placeholder="Recipient"></textarea>
  <small class="text-neutral-500">{charLimit} characters left</small>
</div>

<style lang="postcss">
  h3 {
    @apply text-5xl text-neutral-300;
  }

  textarea {
    @apply no-scrollbar h-[80px] w-3/4 resize-none rounded-3xl px-8 py-6 !transition-colors;
  }
</style>
