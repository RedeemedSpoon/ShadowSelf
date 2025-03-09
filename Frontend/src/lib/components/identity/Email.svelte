<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, ReplyIcon, ForwardIcon, InboxIcon} from '$icon';
  import {mode, target, identity, handleResponse} from '$store';
  import {ActionIcon, Loader} from '$component';
  import EmailBody from './EmailBody.svelte';
  import {fetchAPI, notify} from '$lib';
  import Inbox from './Inbox.svelte';

  let {ws, token}: IdentityComponentParams = $props();

  let label = $state('INBOX') as 'INBOX' | 'Sent' | 'Drafts' | 'Junk';
  let inbox = $state() as FetchAPI;

  async function fetchAllEmails() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    document.getElementById('hold-load')?.remove();
    inbox = await fetchAPI('/api/email/' + $identity.id, token);
  }

  async function deleteEmail() {
    if (label === 'Junk') return;
    ws.send(JSON.stringify({type: 'delete-email', mailbox: label, uid: $target!.uid}));
  }

  async function fetchReply() {
    ws.send(JSON.stringify({type: 'fetch-reply', uuid: $target!.inReplyTo}));
  }

  $handleResponse = (response: WebSocketResponse) => {
    switch (response.type) {
      case 'new-email': {
        notify('New Email Received!', 'success');
        inbox.emails.inbox.unshift(response.newEmail!);
        inbox.emails.messagesCount++;

        inbox.emails = {...inbox.emails};
        break;
      }

      case 'fetch-reply': {
        console.log(response);
        break;
      }

      case 'delete-email': {
        const mailbox = response.mailbox?.toLowerCase();
        const messageCount = mailbox === 'inbox' ? 'messagesCount' : `${mailbox}MessagesCount`;

        // @ts-expect-error nonsense
        const removedEmail = inbox.emails[mailbox].find((email) => email.uid === response.uid);
        inbox.emails.junk.unshift(removedEmail!);
        inbox.emails.junkMessagesCount++;

        // @ts-expect-error nonsense
        inbox.emails[mailbox] = inbox.emails[mailbox].filter((email) => email.uid !== response.uid);
        inbox.emails[messageCount as keyof typeof inbox.emails]--;

        inbox.emails = {...inbox.emails};
        break;
      }
    }
  };
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h3>Email Address</h3>
  <div class="flex gap-1">
    <ActionIcon icon={InboxIcon} action={() => (($mode = 'browse'), ($target = null))} title="Go to Inbox" />
    <ActionIcon icon={SendIcon} action={fetchReply} title="Send New Emails" />
    <ActionIcon disabled={!$target} icon={ReplyIcon} action={() => {}} title="Reply to Email" />
    <ActionIcon disabled={!$target} icon={ForwardIcon} action={() => {}} title="Forward Email" />
    <ActionIcon disabled={!$target} icon={TrashIcon} action={deleteEmail} title="Delete Email" />
  </div>
</section>
<div id="hold-load" class="h-[40vh]"></div>
{#await fetchAllEmails()}
  <div class="flex h-[40vh] items-center justify-center">
    <h3 class="flex items-center gap-6">
      <Loader size="big" skip={true} />Fetching
    </h3>
  </div>
{:then}
  {#if $mode === 'browse'}
    {#key inbox.emails}
      <div class="mt-[5vh] flex items-center justify-between">
        <h3 class="!text-2xl">{$identity.email}</h3>
        <div id="mailbox-labels" class="flex">
          <button class:selected={label === 'INBOX'} onclick={() => (label = 'INBOX')}>Inbox</button>
          <button class:selected={label === 'Sent'} onclick={() => (label = 'Sent')}>Sent</button>
          <button class:selected={label === 'Drafts'} onclick={() => (label = 'Drafts')}>Drafts</button>
          <button class:selected={label === 'Junk'} onclick={() => (label = 'Junk')}>Junk</button>
        </div>
      </div>
      {#if label === 'INBOX'}
        <Inbox inbox={inbox.emails.inbox} count={inbox.emails.messagesCount} label="INBOX" />
      {:else if label === 'Sent'}
        <Inbox inbox={inbox.emails.sent} count={inbox.emails.sentMessagesCount} label="Sent" />
      {:else if label === 'Drafts'}
        <Inbox inbox={inbox.emails.drafts} count={inbox.emails.draftsMessagesCount} label="Drafts" />
      {:else if label === 'Junk'}
        <Inbox inbox={inbox.emails.junk} count={inbox.emails.junkMessagesCount} label="Junk" />
      {/if}
    {/key}
  {:else if $mode === 'read'}
    <EmailBody />
  {/if}
{/await}

<style lang="postcss">
  h3 {
    @apply text-5xl text-neutral-300;
  }

  #mailbox-labels button {
    @apply rounded-none bg-none shadow-none hover:bg-neutral-800/50 hover:bg-none;
    @apply cursor-pointer border border-neutral-800 bg-neutral-800/30 px-4 py-3 first:rounded-l-md last:rounded-r-md;
  }

  #mailbox-labels button.selected {
    @apply bg-primary-600 text-neutral-300;
  }
</style>
