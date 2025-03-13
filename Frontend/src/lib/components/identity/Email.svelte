<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, EditorParams, FetchAPI} from '$type';
  import {mode, reply, target, identity, handleResponse, fetching} from '$store';
  import {SendIcon, TrashIcon, ReplyIcon, ForwardIcon, InboxIcon} from '$icon';
  import {ActionIcon, Loader} from '$component';
  import EmailBody from './EmailBody.svelte';
  import {fetchAPI, notify} from '$lib';
  import Editor from './Editor.svelte';
  import Inbox from './Inbox.svelte';
  import {onMount} from 'svelte';

  let {ws, token}: IdentityComponentParams = $props();

  let label = $state('INBOX') as 'INBOX' | 'Sent' | 'Drafts' | 'Junk';
  const showActionButtons = $derived(!$target || label === 'Junk');
  let inbox = $state() as FetchAPI;
  let from = $state(7) as number;

  onMount(() => (($mode = 'browse'), ($target = null)));

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
    $fetching = 1;

    ws.send(JSON.stringify({type: 'load-more', mailbox: label, from: total - from}));
  }

  function fetchReply(uuid?: string) {
    let alreadyFetched;

    for (const mailbox of ['INBOX', 'Sent']) {
      if (alreadyFetched) continue;

      const box = mailbox.toLowerCase() as 'inbox' | 'sent';
      const message = inbox.emails[box].find((email) => email.messageID.trim() === uuid?.trim());
      if (!message) continue;

      alreadyFetched = true;
      setTimeout(() => ($reply = [...$reply, message]), 25);

      if (message?.inReplyTo) fetchReply(message.inReplyTo);
    }

    if (!alreadyFetched) {
      ws.send(JSON.stringify({type: 'fetch-reply', uuid: uuid?.trim()}));
    }
  }

  function deleteEmail() {
    if (label === 'Junk') return;
    ws.send(JSON.stringify({type: 'delete-email', mailbox: label, uid: $target!.uid}));
  }

  function submit(content: EditorParams, save: boolean, isdraft?: boolean) {
    if (content.attachments.some((attachment) => attachment.data.length > 15 * 1024 * 1024)) {
      return notify('One attachment is too large (>15MB)', 'alert');
    }

    $fetching = save ? 2 : 1;
    const type = save ? 'save-draft' : 'send-email';
    const draft = isdraft ? $target!.uid : null;

    const inReplyTo = save ? $target?.inReplyTo || $target?.messageID : isdraft ? $target?.inReplyTo : $target?.messageID;
    const references = $target ? ($target.reference || []).concat([inReplyTo!]) : [];

    const to = (document.querySelector('input[name="recipient"]') as HTMLInputElement)?.value;
    ws.send(JSON.stringify({type, draft, inReplyTo, references, to, ...content}));
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
        if (response.draft) {
          inbox.emails.drafts = inbox.emails.drafts.filter((draft) => draft.uid !== response.draft);
        }

        inbox.emails.sent.unshift(response.sentEmail!);
        inbox.emails.sentMessagesCount++;

        $fetching = 0;
        $mode = 'browse';
        $target = null;
        break;
      }

      case 'save-draft': {
        if (response.draft) {
          inbox.emails.drafts = inbox.emails.drafts.filter((draft) => draft.uid !== response.draft);
        }

        inbox.emails.drafts.unshift(response.savedDraft!);
        inbox.emails.draftsMessagesCount++;

        $fetching = 0;
        $mode = 'browse';
        $target = null;
        break;
      }

      case 'fetch-reply': {
        if (response.fetchEmail === null) return;
        $reply = [...$reply, response.fetchEmail!];
        if (response.fetchEmail?.inReplyTo) fetchReply(response.fetchEmail.inReplyTo);
        break;
      }

      case 'load-more': {
        const mailbox = response.mailbox?.toLowerCase() as 'inbox';
        inbox.emails[mailbox] = [...inbox.emails[mailbox], ...response.emails!];

        $fetching = 0;
        from += 7;
        break;
      }

      case 'delete-email': {
        const mailbox = response.mailbox?.toLowerCase() as 'inbox';
        const messageCount = mailbox === 'inbox' ? 'messagesCount' : `${mailbox}MessagesCount`;

        const removedEmail = inbox.emails[mailbox].find((email) => email.uid === response.uid);
        inbox.emails.junk.unshift(removedEmail!);
        inbox.emails.junkMessagesCount++;

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
  <h1 class="text-5xl font-bold text-neutral-300">Email Address</h1>
  <div class="flex gap-1">
    <ActionIcon icon={InboxIcon} action={() => (($mode = 'browse'), ($target = null))} title="Go to Inbox" />
    <ActionIcon icon={SendIcon} action={() => (($mode = 'write'), ($target = null))} title="Send New Emails" />
    <ActionIcon
      disabled={label === 'Drafts' || showActionButtons}
      icon={ReplyIcon}
      action={() => ($mode = 'reply')}
      title="Reply to Email" />
    <ActionIcon disabled={label === 'Drafts' || showActionButtons} icon={ForwardIcon} action={() => {}} title="Forward Email" />
    <ActionIcon disabled={showActionButtons} icon={TrashIcon} action={deleteEmail} title="Delete Email" />
  </div>
</section>
<div id="hold-load" class="h-[40vh]"></div>
<Editor {submit} isDraft={label === 'Drafts' && $mode === 'write-draft'} />
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
      {@const labels = [
        {thisLabel: 'INBOX', data: inbox.emails.inbox, count: inbox.emails.messagesCount},
        {thisLabel: 'Sent', data: inbox.emails.sent, count: inbox.emails.sentMessagesCount},
        {thisLabel: 'Drafts', data: inbox.emails.drafts, count: inbox.emails.draftsMessagesCount},
        {thisLabel: 'Junk', data: inbox.emails.junk, count: inbox.emails.junkMessagesCount},
      ]}
      {#each labels as { thisLabel, data, count }}
        {#if label === thisLabel}
          <Inbox {loadMore} inbox={data} {count} {label} />
        {/if}
      {/each}
    {/key}
  {:else if $mode === 'read'}
    <EmailBody email={$target!} />
    {#if $target?.inReplyTo}
      {@const _ = fetchReply($target.inReplyTo)}
      {#each $reply as email}
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
