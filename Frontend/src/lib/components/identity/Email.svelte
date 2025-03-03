<script lang="ts">
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import {ActionIcon} from '$component';
  import {identity} from '$store';
  import {mailbox} from '$image';
  import {onMount} from 'svelte';
  import {fetchAPI} from '$lib';

  let {ws}: {ws: WebSocket} = $props();
  let inbox = $state();

  onMount(async () => (inbox = await fetchAPI('/api/email/' + $identity.id)));
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Email Address</h2>
  <div>
    <ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" />
    <ActionIcon icon={SendIcon} action={() => {}} title="Send Emails" />
    <ActionIcon icon={TrashIcon} action={() => {}} title="Delete Emails" />
  </div>
</section>
{#if inbox?.emails}
  <section>
    <li>Refresh</li>
    <li>Send Emails</li>
    <li>Delete Emails</li>
  </section>
{:else}
  <section id="no-emails" style="background-image: url({mailbox});">
    <h2 class="mt-12 text-5xl text-neutral-300">No Emails</h2>
    <p class="w-1/2 text-center">
      Looks like no emails have been sent to this email yet. Maybe it's a good idea to send one to kick things off?
    </p>
    <button>Send Email</button>
  </section>
{/if}

<style lang="postcss">
  #no-emails {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }
</style>
