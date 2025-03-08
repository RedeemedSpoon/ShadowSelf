<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, RepeatIcon} from '$icon';
  import {base64ToBlob, fetchAPI, notify} from '$lib';
  import {identity, handleResponse} from '$store';
  import {ActionIcon, Loader} from '$component';
  import DOMPurify from 'dompurify';
  import {mailbox} from '$image';

  let {ws, token}: IdentityComponentParams = $props();

  let iframe = $state() as HTMLIFrameElement | null;
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
        bind:this={iframe}
        title={target.subject}
        onload={() => ((iframe!.style.height = iframe!.contentWindow!.document.body.scrollHeight + 70 + 'px'), window.scrollTo(0, 0))}
        srcdoc={DOMPurify.sanitize(target.body)}
        class="h-[40vh] w-full overflow-y-hidden bg-neutral-100"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
    {:else}
      <p class="whitespace-pre-line p-8">{target?.body}</p>
    {/if}
    {#if target?.attachments?.length && target?.attachments.length > 0}
      <div class="flex flex-col gap-4 p-4">
        <h3 class="text-2xl text-neutral-300">Attachments:</h3>
        {#each target.attachments as attachment}
          <a href={URL.createObjectURL(base64ToBlob(attachment.data, 'application/octet-stream'))} download={attachment.filename}>
            {attachment.filename}</a>
        {/each}
      </div>
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
