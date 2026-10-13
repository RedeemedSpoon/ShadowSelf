<script lang="ts">
  import {onMount} from 'svelte';
  import {SvelteSet} from 'svelte/reactivity';
  import {request} from '$utils/webfetch';
  import {sanitizeEmailHtml, base64ToBlob} from '$utils/shared';
  import type {FullIdentity, Email, EmailAPI, Inbox} from '$type';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import Dialog from '$component/ui/Dialog.svelte';
  import MailComposer from './MailComposer.svelte';

  let {account}: {account: FullIdentity} = $props();
  let inbox = $state<Inbox | null>(null);
  let mailbox = $state<'inbox' | 'sent' | 'drafts' | 'junk'>('inbox');
  let target = $state<Email | null>(null);
  let thread = $state<Email[]>([]);
  let mode = $state<'browse' | 'compose' | 'reply' | 'draft'>('browse');
  let pending = $state(false);
  let error = $state('');
  let warning = $state('');
  let forwardOpen = $state(false);
  let forwardTo = $state('');
  let deleteOpen = $state(false);
  let more = $state(true);
  const names = {inbox: 'INBOX', sent: 'Sent', drafts: 'Drafts', junk: 'Junk'};
  const messages = $derived(inbox?.[mailbox] || []);
  const path = $derived(`/identities/${account.id}/mail`);

  async function load() {
    pending = true;
    error = '';

    const result = await request<EmailAPI>(`${path}/messages`);
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    inbox = result.data.emails;
    warning = result.data.warning || '';
  }

  async function loadMore() {
    const since = Math.min(...messages.map((message) => message.uid));

    if (!Number.isSafeInteger(since) || since <= 1) {
      more = false;

      return;
    }

    pending = true;

    const result = await request<EmailAPI>(`${path}/messages/more`, 'GET', {mailbox: names[mailbox], since});
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    if (inbox) {
      inbox[mailbox] = [...messages, ...(result.data.nextEmails || [])];
    }

    more = !!result.data.nextEmails?.length;
  }

  async function open(message: Email) {
    target = message;
    thread = [];
    error = '';

    if (mailbox === 'drafts') {
      mode = 'draft';

      return;
    }

    const seen = new SvelteSet<string>();
    let reference = message.inReplyTo;

    while (reference && !seen.has(reference) && seen.size < 40) {
      seen.add(reference);

      const found = [...(inbox?.inbox || []), ...(inbox?.sent || [])].find((item) => item.messageID.trim() === reference?.trim());
      const result = found ? {ok: true as const, data: {fetchEmail: found}} : await request<EmailAPI>(`${path}/reply`, 'GET', {uuid: reference});

      if (!result.ok) {
        warning = 'Some earlier messages could not be loaded.';
        break;
      }

      if (!result.data.fetchEmail) {
        break;
      }

      thread = [...thread, result.data.fetchEmail];
      reference = result.data.fetchEmail.inReplyTo;
    }
  }

  async function submit(body: Record<string, unknown>, save: boolean) {
    pending = true;
    error = '';

    const result = await request<EmailAPI>(save ? `${path}/draft` : `${path}/messages`, save ? 'PUT' : 'POST', body);
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    warning = result.data.warning || '';
    mode = 'browse';
    target = null;
    await load();
  }

  async function remove() {
    if (!target) {
      return;
    }

    pending = true;

    const result = await request<EmailAPI>(`${path}/messages`, 'DELETE', {mailbox: names[mailbox], uid: target.uid});
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    deleteOpen = false;
    target = null;
    await load();
  }

  async function forward(event: SubmitEvent) {
    event.preventDefault();

    if (!target) {
      return;
    }

    pending = true;

    const result = await request<EmailAPI>(`${path}/forward`, 'POST', {forward: forwardTo, uid: target.uid});
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    forwardOpen = false;
    forwardTo = '';
    target = null;
    warning = result.data.warning || '';
    await load();
  }

  function attachment(file: Email['attachments'][number]) {
    const url = URL.createObjectURL(base64ToBlob(file.data, file.contentType || 'application/octet-stream'));
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function reset(box: typeof mailbox) {
    mailbox = box;
    target = null;
    mode = 'browse';
    more = true;
  }

  onMount(() => {
    void load();

    const incoming = (event: Event) => {
      const update = (event as CustomEvent).detail;

      if (update.identityID !== account.id) {
        return;
      }

      if (update.type === 'email' && inbox) {
        inbox.inbox = [update.email, ...inbox.inbox.filter((message) => message.messageID !== update.email.messageID)];
        inbox.messagesCount++;
      }
    };
    window.addEventListener('identity-update', incoming);

    return () => window.removeEventListener('identity-update', incoming);
  });
</script>

<div class="section-heading">
  <div>
    <h2>Email</h2>
    <p>{account.email}</p>
  </div>
  <div class="button-row">
    <Button variant="quiet" icon="refresh" loading={pending} onclick={load} aria-label="Refresh mailbox" /><Button
      icon="plus"
      onclick={() => {
        target = null;
        mode = 'compose';
      }}>Compose</Button>
  </div>
</div>
<Status message={error} kind="error" /><Status message={warning} />
{#if mode !== 'browse'}<MailComposer
    initial={mode === 'draft' || mode === 'reply' ? target || undefined : undefined}
    reply={mode === 'reply'}
    {pending}
    onsubmit={submit}
    oncancel={() => {
      mode = 'browse';
      target = null;
    }} />
{:else if target}<section class="panel">
    <div class="section-heading">
      <Button variant="quiet" icon="back" onclick={() => (target = null)}>Mailbox</Button>
      <div class="button-row">
        {#if mailbox !== 'junk'}<Button variant="secondary" onclick={() => (mode = 'reply')}>Reply</Button><Button
            variant="quiet"
            onclick={() => (forwardOpen = true)}>Forward</Button
          ><Button variant="quiet" icon="trash" aria-label="Delete email" onclick={() => (deleteOpen = true)} />{/if}
      </div>
    </div>
    {#each [target, ...thread] as message (message.messageID)}<article class="mail-message">
        <h2>{message.subject || 'No subject'}</h2>
        <p>{message.from} → {message.to}</p>
        <small>{new Date(message.date).toLocaleString()}</small>{#if message.type === 'html'}<iframe
            title="Message body from {message.from}"
            sandbox=""
            referrerpolicy="no-referrer"
            srcdoc={`<!doctype html><html><head><meta charset='utf-8'><style>body{color:#c6d1e9;font:14px/1.7 sans-serif;overflow-wrap:anywhere}a{color:#aea5ff}img{max-width:100%}</style></head><body>${sanitizeEmailHtml(message.body, message.attachments)}</body></html>`}
          ></iframe
          >{:else}<pre>{message.body}</pre>{/if}
        <div class="button-row">
          {#each message.attachments as file, index (`${file.filename}-${index}`)}<Button variant="secondary" icon="download" onclick={() => attachment(file)}
              >{file.filename}</Button
            >{/each}
        </div>
      </article>{/each}
  </section>
{:else}<div class="tabs" aria-label="Mailboxes">
    {#each Object.entries(names) as [box, name] (box)}<button class:active={mailbox === box} onclick={() => reset(box as typeof mailbox)}>{name}</button>{/each}
  </div>
  {#if pending && !inbox}<div class="loading-state"><span class="spinner"></span>Loading mailbox</div>{:else if inbox && !messages.length}<div
      class="empty-state">
      <Icon name="mail" size={40} />
      <h2>No messages in {names[mailbox]}</h2>
    </div>{:else if inbox}<div class="mail-list">
      {#each messages as message (message.uid)}<button class="mail-row" onclick={() => open(message)}
          ><span class="mail-from">{mailbox === 'sent' ? message.to : message.from}</span><span class="mail-subject">{message.subject || 'No subject'}</span
          ><time>{new Date(message.date).toLocaleDateString()}</time></button
        >{/each}
    </div>
    {#if more}<div class="more-button"><Button variant="secondary" loading={pending} onclick={loadMore}>Load earlier messages</Button></div>{/if}{:else}<Button
      variant="secondary"
      onclick={load}>Retry loading mailbox</Button
    >{/if}{/if}
<Dialog bind:open={forwardOpen} title="Forward email"
  ><form onsubmit={forward}>
    <div class="field"><label for="forward-email">Recipient</label><input id="forward-email" type="email" bind:value={forwardTo} required /></div>
    <Status message={error} kind="error" /><Button loading={pending} type="submit">Forward message</Button>
  </form></Dialog>
<Dialog bind:open={deleteOpen} title="Move message to junk"
  ><p>The message will leave {names[mailbox]} and move to the junk mailbox.</p>
  <Status message={error} kind="error" />
  <div class="more-button"><Button variant="danger" loading={pending} onclick={remove}>Move to junk</Button></div></Dialog>

<style>
  .mail-list {
    border: 1px solid #a5b4fc20;
    border-radius: 7px;
    overflow: hidden;
  }
  .mail-row {
    display: grid;
    grid-template-columns: minmax(140px, 1fr) minmax(200px, 2fr) auto;
    gap: 20px;
    align-items: center;
    width: 100%;
    text-align: left;
    background: #10192a;
    border: 0;
    border-bottom: 1px solid #a5b4fc16;
    padding: 17px 20px;
    color: #b5c2db;
    font-size: 12px;
  }
  .mail-row:hover {
    background: #172137;
  }
  .mail-row:last-child {
    border-bottom: 0;
  }
  .mail-from,
  .mail-subject {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mail-subject {
    color: #d8dff2;
  }
  .mail-row time {
    font-size: 10px;
    color: #75839e;
  }
  .more-button {
    margin-top: 20px;
  }
  .mail-message {
    border-bottom: 1px solid #a5b4fc20;
    padding: 10px 0 25px;
    margin-bottom: 20px;
  }
  .mail-message iframe {
    border: 0;
    width: 100%;
    min-height: 380px;
    margin-top: 20px;
    background: #090f20;
    border-radius: 5px;
  }
  .mail-message pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 13px;
    line-height: 1.8;
    margin: 23px 0;
    font-family: inherit;
  }
  @media (max-width: 650px) {
    .mail-row {
      grid-template-columns: 1fr auto;
      gap: 9px;
    }
    .mail-subject {
      grid-row: 2;
      grid-column: 1/3;
    }
    .mail-row time {
      grid-column: 2;
      grid-row: 1;
    }
    .mail-message iframe {
      min-height: 450px;
    }
  }
</style>
