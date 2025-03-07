<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import {identity, handleResponse} from '$store';
  import {ActionIcon, Loader} from '$component';
  import {fetchAPI, notify} from '$lib';
  import DOMPurify from 'dompurify';
  import {mailbox} from '$image';

  let {ws, token}: IdentityComponentParams = $props();

  let mode = $state('browse') as 'browse' | 'read' | 'write';
  let target = $state() as FetchAPI['emails']['total'][number] | null;
  let inbox = $state() as FetchAPI;

  async function fetchEmails() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    document.getElementById('hold-load')?.remove();
    inbox = await fetchAPI('/api/email/' + $identity.id, token);
  }

  $handleResponse = (response: WebSocketResponse) => {
    if (response.type === 'new-email') {
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
  {#if mode === 'browse'}
    {#if inbox.emails.messagesCount > 0}
      {#each inbox.emails.total as email}
        <div class="container" aria-hidden="true" onclick={() => ((target = email), (mode = 'read'))}>
          <div class="w-1/2">
            <h3 class="truncate text-2xl text-neutral-300">{email.subject}</h3>
            <p class="text-sm text-neutral-500">{email.date}</p>
          </div>
          <p class="w-1/2 text-right text-sm text-neutral-400">{email.from}</p>
        </div>
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
  {:else if mode === 'read'}
    {#if target?.type === 'html'}
      <iframe
        srcdoc={DOMPurify.sanitize(target.body)}
        title={target.subject}
        class="min-h-[80vh] w-full"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
    {:else}
      <p>{target?.body}</p>
    {/if}
  {/if}
{/await}

<style lang="postcss">
  #no-emails {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  .container {
    @apply flex cursor-pointer items-center border-b border-neutral-700 px-2 py-4 last:border-none hover:bg-neutral-400/5;
  }
</style>
