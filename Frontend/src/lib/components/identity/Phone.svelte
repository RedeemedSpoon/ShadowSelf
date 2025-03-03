<script lang="ts">
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import {ActionIcon} from '$component';
  import {conversation} from '$image';
  import {identity} from '$store';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';

  let {ws}: {ws: WebSocket} = $props();
  let inbox = $state();

  onMount(async () => (inbox = await fetchAPI('/api/phone/' + $identity.id)));
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Phone Number</h2>
  <div>
    <ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" />
    <ActionIcon icon={SendIcon} action={() => {}} title="Send Messages" />
    <ActionIcon icon={TrashIcon} action={() => {}} title="Delete Messages" />
  </div>
</section>
{#if inbox?.messages}
  <section>
    <li>Refresh</li>
    <li>Send SMS</li>
    <li>Delete SMS</li>
  </section>
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

<style lang="postcss">
  #no-messages {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }
</style>
