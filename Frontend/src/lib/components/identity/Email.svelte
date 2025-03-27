<script lang="ts">
  import type {WebSocketResponse, IdentityComponentParams, EditorParams, FetchAPI} from '$type';
  import {SendIcon, TrashIcon, ReplyIcon, UserIcon, ForwardIcon, InboxIcon} from '$icon';
  import {ActionIcon, Loader, Modal, InputWithIcon, LoadingButton} from '$component';
  import {identity, handleResponse, fetchIndex, modalIndex} from '$store';
  import ComposeEmail from './sub-components/ComposeEmail.svelte';
  import EmailInbox from './sub-components/EmailInbox.svelte';
  import EmailBody from './sub-components/EmailBody.svelte';
  import {writable, type Writable} from 'svelte/store';
  import {fetchAPI, notify} from '$lib';
  import {onMount} from 'svelte';

  let {ws, token}: IdentityComponentParams = $props();

  const reply: Writable<FetchAPI['emails']['inbox'][number][]> = writable([]);
  const target: Writable<FetchAPI['emails']['inbox'][number] | null> = writable();
  const mode: Writable<'browse' | 'read' | 'write' | 'write-draft' | 'reply'> = writable('browse');

  let label = $state('INBOX') as 'INBOX' | 'Sent' | 'Drafts' | 'Junk';
  let inbox = $state() as FetchAPI;
  let from = $state(7) as number;

  const showActionButtons = $derived(!$target || label === 'Junk');
  const className = {
    label: '!bg-neutral-900/50 !border-neutral-700',
    icon: 'fill-neutral-700 stroke-neutral-700',
    input: 'placeholder-neutral-700 !bg-neutral-900/50 !border-neutral-700',
    wrapper: 'w-2/3',
  };

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
    $fetchIndex = 1;

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

  function forwardEmail() {
    $fetchIndex = 3;
    const forward = (document.querySelector('input[name="forward"]') as HTMLInputElement)?.value;
    ws.send(JSON.stringify({type: 'forward-email', forward, uid: $target!.uid}));
  }

  function submit(content: EditorParams, save: boolean, isdraft?: boolean) {
    if (content.attachments.some((attachment) => attachment.data.length > 15 * 1024 * 1024)) {
      return notify('One attachment is too large (>15MB)', 'alert');
    }

    $fetchIndex = save ? 2 : 1;
    const type = save ? 'save-draft' : 'send-email';
    const draft = isdraft ? $target!.uid : null;

    const inReplyTo = save ? $target?.inReplyTo || $target?.messageID : isdraft ? $target?.inReplyTo : $target?.messageID;
    const references = $target && inReplyTo ? ($target.references || []).concat([inReplyTo!]) : [];

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

        $fetchIndex = 0;
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

        $fetchIndex = 0;
        $mode = 'browse';
        $target = null;
        break;
      }

      case 'forward-email': {
        inbox.emails.sent.unshift(response.forwardEmail!);

        $fetchIndex = 0;
        $modalIndex = 0;
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

        $fetchIndex = 0;
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
        $mode = 'browse';
        $target = null;
        from--;
        break;
      }
    }
  };
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-2xl font-bold text-neutral-300 sm:text-4xl md:text-5xl">Email Address</h1>
  <div class="grid gap-1 max-md:grid-cols-3 md:grid-flow-col">
    <ActionIcon icon={InboxIcon} action={() => (($mode = 'browse'), ($target = null))} title="Go to Inbox" />
    <ActionIcon icon={SendIcon} action={() => (($mode = 'write'), ($target = null))} title="Send New Email" />
    <ActionIcon
      disabled={label === 'Drafts' || showActionButtons}
      icon={ReplyIcon}
      action={() => ($mode = 'reply')}
      title="Reply to Email" />
    <ActionIcon
      disabled={label === 'Drafts' || showActionButtons}
      icon={ForwardIcon}
      action={() => ($modalIndex = 1)}
      title="Forward Email" />
    <ActionIcon disabled={showActionButtons} icon={TrashIcon} action={deleteEmail} title="Delete Email" />
  </div>
</section>
<div id="hold-load" class="h-[40vh]"></div>
<ComposeEmail {submit} isDraft={label === 'Drafts' && $mode === 'write-draft'} {target} {mode} />
<Modal>
  <div class="flex flex-col items-center gap-8 p-4 md:p-8">
    <h3 class="w-full !text-3xl text-neutral-300 md:!text-5xl">Forward Email to Another Address</h3>
    <p class="md:w-[40vw]">
      Enter the email address of the recipient you would like to forward this email to. The original headers will be shown on top of
      the body.
    </p>
    <InputWithIcon {className} icon={UserIcon} type="email" placeholder="username@domain.tld" name="forward" />
    <LoadingButton index={3} className="w-2/3" onclick={forwardEmail}>Forward Email</LoadingButton>
  </div>
</Modal>
{#await fetchAllEmails()}
  <div class="flex h-[40vh] items-center justify-center">
    <h3 class="flex items-center gap-6">
      <Loader size="big" skip={true} />Fetching
    </h3>
  </div>
{:then}
  {#if $mode === 'browse'}
    {#key inbox.emails}
      <div class="mb-2 mt-[5vh] flex justify-between gap-4 max-md:flex-col md:items-center">
        <div class="[*&>p]:!text-neutral-500">
          <h3 class="!text-2xl lg:!text-3xl">{$identity.email}</h3>
          {#if label === 'INBOX'}
            <p>{inbox.emails.messagesCount} Emails in Inbox</p>
          {:else if label === 'Sent'}
            <p>{inbox.emails.sentMessagesCount} Emails Sent</p>
          {:else if label === 'Drafts'}
            <p>{inbox.emails.draftsMessagesCount} Drafts</p>
          {:else}
            <p>{inbox.emails.junkMessagesCount} Junk/Deleted Emails</p>
          {/if}
        </div>
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
          <EmailInbox {loadMore} inbox={data} {count} {label} {target} {mode} {reply} />
        {/if}
      {/each}
    {/key}
  {:else if $mode === 'read'}
    <EmailBody email={$target!} />
    {#if $target?.inReplyTo}
      {@const _ = fetchReply($target.inReplyTo)}
      {#each $reply as email}
        <h3 class="mt-8 flex items-center gap-2 !text-2xl text-neutral-300">
          <ReplyIcon />In Reply To :
        </h3>
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
