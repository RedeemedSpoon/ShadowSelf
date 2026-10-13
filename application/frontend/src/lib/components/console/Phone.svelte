<script lang="ts">
  import {onMount} from 'svelte';
  import {request} from '$utils/webfetch';
  import type {FullIdentity, Message, PhoneAPI} from '$type';
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
  let pending = $state(false);
  let loaded = $state(false);
  let error = $state('');
  let deleteOpen = $state(false);
  const path = $derived(`/identities/${account.id}/phone`);

  function partner(message: Message) {
    return message.from === account.phone ? message.to : message.from;
  }

  async function load() {
    pending = true;
    error = '';

    const result = await request<PhoneAPI>(`${path}/conversations`);
    pending = false;
    loaded = true;

    if (!result.ok) {
      error = result.error;

      return;
    }

    messages = result.data.messages;
  }

  async function open(message: Message) {
    recipient = partner(message);
    selected = true;
    pending = true;
    error = '';

    const result = await request<PhoneAPI>(`${path}/conversation`, 'GET', {addressee: recipient});
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    conversation = result.data.conversation || [];
  }

  async function send(event: SubmitEvent) {
    event.preventDefault();
    pending = true;
    error = '';

    const result = await request<PhoneAPI>(`${path}/messages`, 'POST', {addressee: recipient, body});
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    if (result.data.messageSent) {
      conversation = [...conversation, result.data.messageSent];
    }

    body = '';
    await load();
  }

  async function remove() {
    pending = true;

    const result = await request(`${path}/conversations`, 'DELETE', {addressee: recipient});
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    deleteOpen = false;
    selected = false;
    conversation = [];
    await load();
  }

  onMount(() => {
    void load();

    const incoming = (event: Event) => {
      const update = (event as CustomEvent).detail;

      if (update.identityID !== account.id) {
        return;
      }

      if (update.type !== 'message') {
        return;
      }

      const message = update.message as Message;
      messages = [message, ...messages.filter((item) => partner(item) !== partner(message))];

      if (selected && partner(message) === recipient) {
        conversation = [...conversation.filter((item) => item.messageID !== message.messageID), message];
      }
    };
    window.addEventListener('identity-update', incoming);

    return () => window.removeEventListener('identity-update', incoming);
  });
</script>

<div class="section-heading">
  <div>
    <h2>Phone</h2>
    <p>{formatPhoneNumber(account.phone)}</p>
  </div>
  <div class="button-row">
    <Button variant="quiet" icon="refresh" loading={pending} onclick={load} aria-label="Refresh conversations" /><Button
      icon="plus"
      onclick={() => {
        recipient = '';
        conversation = [];
        selected = true;
      }}>New conversation</Button>
  </div>
</div>
<Status message={error} kind="error" />
{#if selected}<section class="panel">
    <div class="section-heading">
      <Button variant="quiet" icon="back" onclick={() => (selected = false)}>Conversations</Button>{#if conversation.length}<Button
          variant="quiet"
          icon="trash"
          onclick={() => (deleteOpen = true)}>Delete conversation</Button
        >{/if}
    </div>
    <div class="conversation">
      {#each [...conversation].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) as message (message.messageID)}<article
          class:outgoing={message.from === account.phone}>
          <p>{message.body}</p>
          <small>{new Date(message.date).toLocaleString()} · {message.status}</small>{#if message.error}<Status message={message.error} kind="error" />{/if}
        </article>{/each}
    </div>
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
        <label for="sms-body">Message</label><textarea id="sms-body" bind:value={body} minlength="4" maxlength="160" required></textarea><small
          >{body.length} characters · {Math.max(1, Math.ceil(body.length / 160))} SMS segment estimate. Unicode can use more segments.</small>
      </div>
      <Button type="submit" icon="send" loading={pending}>Send message</Button>
    </form>
  </section>
{:else if pending && !loaded}<div class="loading-state"><span class="spinner"></span>Loading conversations</div>{:else if error && !messages.length}<Button
    variant="secondary"
    loading={pending}
    onclick={load}>Retry loading conversations</Button
  >{:else if !messages.length && !error}<div class="empty-state">
    <Icon name="phone" size={40} />
    <h2>No conversations yet</h2>
    <Button icon="plus" onclick={() => (selected = true)}>Start a conversation</Button>
  </div>{:else}<div class="conversation-list">
    {#each messages as message (message.messageID)}<button onclick={() => open(message)}
        ><span><strong>{formatPhoneNumber(partner(message))}</strong><small>{message.body}</small></span><time
          >{new Date(message.date).toLocaleDateString()}</time
        ><Icon name="arrow" size={16} /></button
      >{/each}
  </div>{/if}
<Dialog bind:open={deleteOpen} title="Delete conversation"
  ><p>All messages with {recipient} will be removed from this identity.</p>
  <Status message={error} kind="error" />
  <div class="delete-buttons"><Button variant="danger" loading={pending} onclick={remove}>Delete messages</Button></div></Dialog>

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
