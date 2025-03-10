<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, EditorParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, ReplyIcon, ForwardIcon, InboxIcon} from '$icon';
  import {mode, target, identity, handleResponse} from '$store';
  import {ActionIcon, Loader} from '$component';
  import EmailBody from './EmailBody.svelte';
  import {fetchAPI, notify} from '$lib';
  import Editor from './Editor.svelte';
  import Inbox from './Inbox.svelte';

  let {ws, token}: IdentityComponentParams = $props();

  let label = $state('INBOX') as 'INBOX' | 'Sent' | 'Drafts' | 'Junk';
  let reply = $state([]) as FetchAPI['emails']['inbox'][number][];
  let inbox = $state() as FetchAPI;
  let from = $state(7) as number;

  async function fetchAllEmails() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    document.getElementById('hold-load')?.remove();
    inbox = await fetchAPI('/api/email/' + $identity.id, token);
    $target = null;
    from = 7;
  }

  function loadMore() {
    const messageCountString = label.toLowerCase() === 'inbox' ? 'messagesCount' : `${label.toLowerCase()}MessagesCount`;
    const total = inbox.emails[messageCountString as keyof typeof inbox.emails] as number;
    ws.send(JSON.stringify({type: 'load-more', mailbox: label, from: total - from}));
  }

  function fetchReply(uuid?: string) {
    let alreadyFetched;

    for (const mailbox of ['INBOX', 'Sent']) {
      // @ts-expect-error nonsense
      const message = inbox.emails[mailbox.toLowerCase()].find((email) => email.inReplyTo === uuid);
      if (!message) continue;

      setTimeout(() => (reply = [...reply, message]), 100);
      alreadyFetched = true;

      if (message?.inReplyTo) fetchReply(message.inReplyTo);
    }

    if (!alreadyFetched) ws.send(JSON.stringify({type: 'fetch-reply', uuid: uuid || $target!.inReplyTo}));
  }

  function deleteEmail() {
    if (label === 'Junk') return;
    ws.send(JSON.stringify({type: 'delete-email', mailbox: label, uid: $target!.uid}));
  }

  function saveDraft(content: EditorParams) {}

  function sendEmail(content: EditorParams) {
    if ($mode === 'reply') {
      const inReplyTo = $target!.messageID;
      ws.send(JSON.stringify({type: 'send-email', inReplyTo, ...content}));
    } else {
      const to = (document.querySelector('input[name="recipient"]') as HTMLInputElement)?.value;
      ws.send(JSON.stringify({type: 'send-email', to, ...content}));
    }
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

      case 'send-email': {
        break;
      }

      case 'send-draft': {
        break;
      }

      case 'fetch-reply': {
        if (response.fetchEmail === null) return;
        reply = [...reply, response.fetchEmail!];
        if (response.fetchEmail?.inReplyTo) fetchReply(response.fetchEmail.inReplyTo);
        break;
      }

      case 'load-more': {
        // @ts-expect-error nonsense
        inbox.emails[response.mailbox.toLowerCase()] = [...inbox.emails[response.mailbox.toLowerCase()], ...response.emails!];
        from += 7;
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
        $target = null;
        break;
      }
    }
  };
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h3>Email Address</h3>
  <div class="flex gap-1">
    <ActionIcon icon={InboxIcon} action={() => (($mode = 'browse'), ($target = null))} title="Go to Inbox" />
    <ActionIcon icon={SendIcon} action={() => (($mode = 'write'), ($target = null))} title="Send New Emails" />
    <ActionIcon disabled={!$target} icon={ReplyIcon} action={() => ($mode = 'reply')} title="Reply to Email" />
    <ActionIcon disabled={!$target} icon={ForwardIcon} action={() => {}} title="Forward Email" />
    <ActionIcon disabled={!$target} icon={TrashIcon} action={deleteEmail} title="Delete Email" />
  </div>
</section>
<div id="hold-load" class="h-[40vh]"></div>
<div class:hidden={$mode === 'browse' || $mode === 'read'}>
  <Editor {saveDraft} {sendEmail} />
</div>
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
          <button class:selected={label === 'INBOX'} onclick={() => ((label = 'INBOX'), ($target = null))}>Inbox</button>
          <button class:selected={label === 'Sent'} onclick={() => ((label = 'Sent'), ($target = null))}>Sent</button>
          <button class:selected={label === 'Drafts'} onclick={() => ((label = 'Drafts'), ($target = null))}>Drafts</button>
          <button class:selected={label === 'Junk'} onclick={() => ((label = 'Junk'), ($target = null))}>Junk</button>
        </div>
      </div>
      {#if label === 'INBOX'}
        <Inbox {loadMore} inbox={inbox.emails.inbox} count={inbox.emails.messagesCount} label="INBOX" />
      {:else if label === 'Sent'}
        <Inbox {loadMore} inbox={inbox.emails.sent} count={inbox.emails.sentMessagesCount} label="Sent" />
      {:else if label === 'Drafts'}
        <Inbox {loadMore} inbox={inbox.emails.drafts} count={inbox.emails.draftsMessagesCount} label="Drafts" />
      {:else if label === 'Junk'}
        <Inbox {loadMore} inbox={inbox.emails.junk} count={inbox.emails.junkMessagesCount} label="Junk" />
      {/if}
    {/key}
  {:else if $mode === 'read'}
    <EmailBody email={$target!} />
    {#if $target?.inReplyTo}
      {@const _ = fetchReply()}
      {#each reply as email}
        <p>Response to: {email.subject}</p>
        <EmailBody {email} />
      {/each}
    {/if}
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
