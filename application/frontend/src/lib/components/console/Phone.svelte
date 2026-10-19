<script lang="ts">
  import LoadingState from '$component/ui/LoadingState.svelte';
  import {onMount} from 'svelte';
  import {request} from '$utils/webfetch';
  import type {FullIdentity, Message, MessagePage, MessageDeletion} from '$type';
  import {formatPhoneNumber} from '$utils/formatting';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import Dialog from '$component/ui/Dialog.svelte';

  let {account}: {account: FullIdentity} = $props();
  let messages = $state<Message[]>([]);
  let conversation = $state<Message[]>([]);
  let recipient = $state('');
  let body = $state('');
  let selected = $state(false);
  let pending = $state(true);
  let loaded = $state(false);
  let error = $state('');
  let notice = $state('');
  let deleteOpen = $state(false);
  let listCursor = $state<string | null>(null);
  let conversationCursor = $state<string | null>(null);
  let generation = 0;
  let controller: AbortController | undefined;
  const path = $derived(`/identities/${account.id}/phone`);

  function partner(message: Message) {
    return message.from === account.phone ? message.to : message.from;
  }

  function invalidate() {
    generation++;
    controller?.abort();
    controller = new AbortController();
    pending = false;

    return generation;
  }

  async function load(append = false) {
    const current = invalidate();
    const cursor = append ? listCursor : undefined;
    pending = true;
    error = '';

    const result = await request<MessagePage>(`${path}/conversations`, 'GET', {cursor}, controller?.signal);

    if (current !== generation) {
      return;
    }

    pending = false;
    loaded = true;

    if (!result.ok) {
      error = result.error;

      return;
    }

    const combined = [...(append ? messages : []), ...result.data.messages].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    messages = [...new Map(combined.reverse().map((message) => [partner(message), message])).values()].reverse();
    listCursor = result.data.nextCursor;
  }

  async function open(message?: Message, append = false) {
    const contact = message ? partner(message) : recipient;
    const cursor = append ? conversationCursor : undefined;
    const current = invalidate();
    recipient = contact;
    selected = true;
    pending = true;
    error = '';

    if (!append) {
      conversation = [];
      conversationCursor = null;
    }

    const result = await request<MessagePage>(
      `${path}/conversation`,
      'GET',
      {addressee: contact, cursor},
      controller?.signal,
    );

    if (current !== generation || recipient !== contact) {
      return;
    }

    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    conversation = [
      ...new Map([...conversation, ...result.data.messages].map((item) => [item.messageID, item])).values(),
    ];
    conversationCursor = result.data.nextCursor;
  }

  async function send(event: SubmitEvent) {
    event.preventDefault();
    const contact = recipient;
    const text = body;
    const current = invalidate();
    pending = true;
    error = '';

    const result = await request<{messageSent: Message}>(`${path}/messages`, 'POST', {addressee: contact, body: text});

    if (current !== generation || recipient !== contact) {
      return;
    }

    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    const message = result.data.messageSent;
    conversation = [...conversation, message];
    messages = [message, ...messages.filter((item) => partner(item) !== contact)];
    body = '';
  }

  async function remove() {
    const contact = recipient;
    const current = invalidate();
    pending = true;
    error = '';

    const result = await request<MessageDeletion>(`${path}/conversations`, 'DELETE', {addressee: contact});

    if (current !== generation || recipient !== contact) {
      return;
    }

    pending = false;

    if (!result.ok) {
      error = result.error;
      notice = 'Deletion was not confirmed. Retry to continue removing remaining messages.';

      return;
    }

    notice = `${result.data.deleted} messages removed in this batch.`;

    if (!result.data.complete) {
      notice += ' Messages remain. Continue deletion to remove the next batch.';

      if (result.data.failed) {
        error = `${result.data.failed} messages could not be removed. Retry to continue.`;
      }

      return;
    }

    notice = 'Conversation deletion confirmed. New incoming messages can still arrive.';
    deleteOpen = false;
    reset();
    await load();
  }

  function reset(newConversation = false) {
    invalidate();
    selected = newConversation;
    recipient = '';
    conversation = [];
    conversationCursor = null;
    body = '';
  }

  onMount(() => {
    void load();

    const incoming = (event: Event) => {
      const update = (event as CustomEvent).detail;

      if (update.identityID !== account.id || update.type !== 'message') {
        return;
      }

      const message = update.message as Message;
      messages = [message, ...messages.filter((item) => partner(item) !== partner(message))];

      if (selected && partner(message) === recipient) {
        conversation = [...conversation.filter((item) => item.messageID !== message.messageID), message];
      }
    };
    window.addEventListener('identity-update', incoming);

    return () => {
      invalidate();
      window.removeEventListener('identity-update', incoming);
    };
  });
</script>

<div class="section-heading">
  <div>
    <h2>Phone</h2>
    <p>{formatPhoneNumber(account.phone)}</p>
  </div>
  <div class="button-row">
    <Button
      variant="quiet"
      icon="refresh"
      loading={pending}
      onclick={() => load()}
      aria-label="Refresh conversations" /><Button icon="plus" onclick={() => reset(true)}>New conversation</Button>
  </div>
</div>
<Status message={error} kind="error" /><Status message={notice} />
{#if selected}<section class="panel">
    <div class="section-heading">
      <Button variant="quiet" icon="back" onclick={() => reset()}>Conversations</Button>{#if conversation.length}<Button
          variant="quiet"
          icon="trash"
          onclick={() => (deleteOpen = true)}>Delete conversation</Button
        >{/if}
    </div>
    <div class="conversation">
      {#each [...conversation].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) as message (message.messageID)}<article
          class:outgoing={message.from === account.phone}>
          <p>{message.body}</p>
          <small>{new Date(message.date).toLocaleString()} · {message.status}</small>{#if message.error}<Status
              message={message.error}
              kind="error" />{/if}
        </article>{/each}
    </div>
    {#if conversationCursor}<Button variant="secondary" loading={pending} onclick={() => open(undefined, true)}
        >Load earlier messages</Button
      >{/if}
    <form onsubmit={send}>
      <div class="field">
        <label for="sms-recipient">Recipient phone number</label><input
          id="sms-recipient"
          type="tel"
          bind:value={recipient}
          placeholder="+12025550123"
          pattern={'\\+[1-9][0-9]{9,14}'}
          required
          readonly={conversation.length > 0} />
      </div>
      <div class="field">
        <label for="sms-body">Message</label><textarea
          id="sms-body"
          bind:value={body}
          minlength="1"
          maxlength="160"
          required></textarea
        ><small
          >{body.length} characters · {Math.max(1, Math.ceil(body.length / 160))} SMS segment estimate. Unicode can use more
          segments.</small>
      </div>
      <Button type="submit" icon="send" loading={pending}>Send message</Button>
    </form>
  </section>
{:else if pending && !loaded}<LoadingState label="Loading conversations" />{:else if error && !messages.length}<Button
    variant="secondary"
    loading={pending}
    onclick={() => load()}>Retry loading conversations</Button
  >{:else if !messages.length && !error}<div class="empty-state">
    <Icon name="phone" size={40} />
    <h2>No conversations yet</h2>
    <Button icon="plus" onclick={() => reset(true)}>Start a conversation</Button>
  </div>{:else}<div class="conversation-list">
    {#each messages as message (message.messageID)}<button onclick={() => open(message)}
        ><span><strong>{formatPhoneNumber(partner(message))}</strong><small>{message.body}</small></span><time
          >{new Date(message.date).toLocaleDateString()}</time
        ><Icon name="arrow" size={16} /></button
      >{/each}
  </div>
  {#if listCursor}<div class="delete-buttons">
      <Button variant="secondary" loading={pending} onclick={() => load(true)}>Load more contacts</Button>
      <p>Contacts are summarized from loaded message pages. Earlier pages may include more contacts.</p>
    </div>{/if}{/if}
<Dialog bind:open={deleteOpen} title="Delete conversation"
  ><p>
    Messages with {recipient} are removed in bounded batches. Continue until deletion is confirmed; closing this dialog leaves
    any remaining messages available.
  </p>
  <Status message={error} kind="error" />
  <Status message={notice} />
  <div class="delete-buttons">
    <Button variant="danger" loading={pending} onclick={remove}>Delete next batch</Button>
  </div></Dialog>

<style>
  .conversation-list {
    display: grid;
    gap: 9px;
  }
  .conversation-list button {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    width: 100%;
    background: #10192a;
    border: 1px solid #a5b4fc20;
    border-radius: 6px;
    color: #c5d1e8;
    text-align: left;
  }
  .conversation-list button > span {
    flex: 1;
    min-width: 0;
  }
  .conversation-list strong {
    font-size: 13px;
    font-weight: 500;
  }
  .conversation-list small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 6px;
  }
  .conversation-list time {
    font-size: 10px;
    color: #7c8ba6;
  }
  .conversation {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 25px;
    max-height: 500px;
    overflow-y: auto;
  }
  .conversation article {
    background: #ffffff04;
    border: 1px solid #a5b4fc20;
    border-radius: 6px;
    padding: 14px;
    max-width: 85%;
    align-self: flex-start;
  }
  .conversation article.outgoing {
    align-self: flex-end;
    background: #6253ec12;
    border-color: #8472ed30;
  }
  .conversation article p {
    color: #d3dded;
    white-space: pre-wrap;
  }
  .conversation article small {
    font-size: 9px;
    display: block;
    margin-top: 8px;
  }
  .delete-buttons {
    margin-top: 20px;
  }
</style>
