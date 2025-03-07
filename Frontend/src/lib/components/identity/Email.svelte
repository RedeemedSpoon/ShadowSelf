<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import {identity, handleResponse} from '$store';
  import {ActionIcon, Loader} from '$component';
  import {mailbox} from '$image';
  import {fetchAPI, notify} from '$lib';

  let {ws, token}: IdentityComponentParams = $props();
  let inbox = $state() as FetchAPI;

  async function fetchEmails() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    document.getElementById('hold-load')?.remove();
    inbox = await fetchAPI('/api/email/' + $identity.id, token);
  }

  $handleResponse = (response: WebSocketResponse) => {
    if (response.type === 'new-email') {
      console.log('a');
      notify('New Email Received! Check your inbox', 'success');
      inbox.emails.total.unshift(response.newEmail!);
    }
  };
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">Email Address</h2>
  <div>
    <ActionIcon icon={RepeatIcon} action={() => {}} title="Refresh" />
    <ActionIcon icon={SendIcon} action={() => {}} title="Send Emails" />
    <ActionIcon icon={TrashIcon} action={() => {}} title="Delete Emails" />
  </div>
</section>
<div id="hold-load" class="h-[40vh]"></div>
{#await fetchEmails()}
  <div class="flex h-[40vh] items-center justify-center">
    <h3 class="flex items-center gap-6 text-5xl text-neutral-300">
      <Loader size="big" skip={true} />Fetching
    </h3>
  </div>
{:then}
  {#if inbox.emails.messagesCount > 0}
    {#each inbox.emails.total as email}
      <p>{email.subject}</p>
    {/each}
  {:else}
    <section id="no-emails" style="background-image: url({mailbox});">
      <h2 class="mt-12 text-5xl text-neutral-300">No Emails</h2>
      <p class="w-1/2 text-center">
        Looks like no emails have been sent to this email yet. Maybe it's a good idea to send one to kick things off?
      </p>
      <button>Send Email</button>
    </section>
  {/if}
{/await}

<style lang="postcss">
  #no-emails {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }
</style>
