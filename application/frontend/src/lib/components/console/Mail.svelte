<script lang="ts">
  import LoadingState from '$component/ui/LoadingState.svelte';
  import {onMount} from 'svelte';
  import {SvelteSet} from 'svelte/reactivity';
  import {request} from '$utils/webfetch';
  import {sanitizeEmailHtml, base64ToBlob} from '$utils/shared';
  import type {FullIdentity, Email, EmailSummary, EmailPage, EmailMutation, Mailbox, Attachment} from '$type';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import Dialog from '$component/ui/Dialog.svelte';
  import MailComposer from './MailComposer.svelte';

  let {account}: {account: FullIdentity} = $props();
  let page = $state<EmailPage | null>(null);
  let mailbox = $state<Mailbox>('INBOX');
  let target = $state<Email | null>(null);
  let thread = $state<Email[]>([]);
  let mode = $state<'browse' | 'compose' | 'reply' | 'draft'>('browse');
  let pending = $state(true);
  let error = $state('');
  let warning = $state('');
  let forwardOpen = $state(false);
  let forwardTo = $state('');
  let deleteOpen = $state(false);
  let generation = 0;
  let controller: AbortController | undefined;
  const names: Mailbox[] = ['INBOX', 'Sent', 'Drafts', 'Junk'];
  const messages = $derived(page?.messages || []);
  const path = $derived(`/identities/${account.id}/mail`);

  function invalidate() {
    generation++;
    controller?.abort();
    controller = new AbortController();
    pending = false;

    return generation;
  }

  async function load(append = false) {
    const box = mailbox;
    const cursor = append ? page?.nextCursor : undefined;

    if (append && !cursor) {
      return;
    }

    const current = invalidate();
    pending = true;
    error = '';

    const result = await request<EmailPage>(
      `${path}/messages`,
      'GET',
      {mailbox: box, before: cursor},
      controller?.signal,
    );

    if (current !== generation || mailbox !== box) {
      return;
    }

    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    const existing = append ? messages : [];
    const combined = [
      ...new Map([...existing, ...result.data.messages].map((message) => [message.uid, message])).values(),
    ];
    page = {...result.data, messages: combined.sort((a, b) => b.uid - a.uid)};
  }

  async function open(message: EmailSummary) {
    const current = invalidate();
    const box = mailbox;
    pending = true;
    target = null;
    thread = [];
    error = '';
    warning = '';

    const result = await request<{email: Email}>(
      `${path}/message`,
      'GET',
      {mailbox: box, uid: message.uid},
      controller?.signal,
    );

    if (current !== generation) {
      return;
    }

    if (!result.ok) {
      pending = false;
      error = result.error;

      return;
    }

    target = result.data.email;
    message.read = true;

    if (box === 'Drafts') {
      for (const file of target.attachments) {
        const attached = await request<{attachment: Attachment}>(
          `${path}/attachment`,
          'GET',
          {mailbox: box, uid: message.uid, index: file.index},
          controller?.signal,
        );

        if (current !== generation) {
          return;
        }

        if (!attached.ok) {
          pending = false;
          error = 'Draft attachments could not be loaded. Reopen the draft before editing.';
          target = null;

          return;
        }

        file.data = attached.data.attachment.data;
      }

      mode = 'draft';
      pending = false;

      return;
    }

    pending = false;
    const seen = new SvelteSet<string>(target.messageID ? [target.messageID] : []);
    const locations = new SvelteSet([`${target.mailbox}-${target.uid}`]);
    let reference = target.inReplyTo;

    while (reference && !seen.has(reference) && seen.size < 40) {
      seen.add(reference);
      const earlier = await request<{fetchEmail: Email | null}>(
        `${path}/reply`,
        'GET',
        {uuid: reference},
        controller?.signal,
      );

      if (current !== generation) {
        return;
      }

      if (!earlier.ok) {
        warning = 'Some earlier messages could not be loaded.';
        break;
      }

      if (!earlier.data.fetchEmail) {
        break;
      }

      const location = `${earlier.data.fetchEmail.mailbox}-${earlier.data.fetchEmail.uid}`;

      if (locations.has(location)) {
        break;
      }

      locations.add(location);
      thread = [...thread, earlier.data.fetchEmail];
      reference = earlier.data.fetchEmail.inReplyTo;
    }
  }

  async function mutate(endpoint: string, method: string, body: Record<string, unknown>) {
    const current = invalidate();
    pending = true;
    error = '';

    const result = await request<EmailMutation>(`${path}/${endpoint}`, method, body);

    if (current !== generation) {
      return;
    }

    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    warning = result.data.warning || '';
    mode = 'browse';
    target = null;
    forwardOpen = false;
    deleteOpen = false;
    await load();
  }

  async function submit(body: Record<string, unknown>, save: boolean) {
    await mutate(save ? 'draft' : 'messages', save ? 'PUT' : 'POST', body);
  }

  async function remove() {
    if (target) {
      await mutate('messages', 'DELETE', {mailbox: target.mailbox, uid: target.uid});
    }
  }

  async function forward(event: SubmitEvent) {
    event.preventDefault();

    if (target) {
      await mutate('forward', 'POST', {forward: forwardTo, mailbox: target.mailbox, uid: target.uid});
    }
  }

  async function attachment(message: Email, index: number) {
    const current = generation;
    const result = await request<{attachment: Attachment}>(
      `${path}/attachment`,
      'GET',
      {mailbox: message.mailbox, uid: message.uid, index},
      controller?.signal,
    );

    if (current !== generation) {
      return;
    }

    if (!result.ok) {
      error = result.error;

      return;
    }

    const file = result.data.attachment;
    const url = URL.createObjectURL(base64ToBlob(file.data, file.contentType || 'application/octet-stream'));
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function reset(box = mailbox) {
    invalidate();
    mailbox = box;
    target = null;
    thread = [];
    mode = 'browse';
    page = null;
    void load();
  }

  onMount(() => {
    void load();

    const incoming = (event: Event) => {
      const update = (event as CustomEvent).detail;

      if (update.identityID !== account.id || update.type !== 'email' || mailbox !== 'INBOX' || !page) {
        return;
      }

      const email = update.email as EmailSummary;
      const existing = page.messages.some((message) => message.uid === email.uid);
      page.messages = [email, ...page.messages.filter((message) => message.uid !== email.uid)];

      if (!existing) {
        page.messagesCount++;
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
    <h2>Email</h2>
    <p>{account.email}</p>
  </div>
  <div class="button-row">
    <Button
      variant="quiet"
      icon="refresh"
      loading={pending}
      onclick={() => load()}
      aria-label="Refresh mailbox" /><Button
      icon="plus"
      onclick={() => {
        invalidate();
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
      <Button variant="quiet" icon="back" onclick={() => reset()}>Mailbox</Button>
      <div class="button-row">
        {#if mailbox !== 'Junk'}<Button variant="secondary" onclick={() => (mode = 'reply')}>Reply</Button><Button
            variant="quiet"
            onclick={() => (forwardOpen = true)}>Forward</Button
          ><Button variant="quiet" icon="trash" aria-label="Delete email" onclick={() => (deleteOpen = true)} />{/if}
      </div>
    </div>
    {#each [target, ...thread] as message (`${message.mailbox}-${message.uid}`)}<article class="mail-message">
        <h2>{message.subject || 'No subject'}</h2>
        <p>{message.from} → {message.to}</p>
        <small>{new Date(message.date).toLocaleString()}</small>{#if message.type === 'html'}<iframe
            title="Message body from {message.from}"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            referrerpolicy="no-referrer"
            srcdoc={`<!doctype html><html><head><meta charset='utf-8'><meta http-equiv='Content-Security-Policy' content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>body{color:#c6d1e9;font:14px/1.7 sans-serif;overflow-wrap:anywhere}a{color:#aea5ff}img{max-width:100%}</style></head><body>${sanitizeEmailHtml(
              message.body,
              message.attachments.filter((file): file is typeof file & Attachment => !!file.data),
            )}</body></html>`}></iframe
          >{:else}<pre>{message.body}</pre>{/if}
        <div class="button-row">
          {#each message.attachments as file, index (`${file.filename}-${index}`)}<Button
              variant="secondary"
              icon="download"
              onclick={() => attachment(message, file.index)}>{file.filename}</Button
            >{/each}
        </div>
      </article>{/each}
  </section>
{:else}<div class="tabs" aria-label="Mailboxes">
    {#each names as box (box)}<button class:active={mailbox === box} onclick={() => reset(box as typeof mailbox)}
        >{box}</button
      >{/each}
  </div>
  {#if pending && !page}<LoadingState label="Loading mailbox" />{:else if page && !messages.length}<div
      class="empty-state">
      <Icon name="mail" size={40} />
      <h2>No messages in {mailbox}</h2>
      <p>
        {mailbox === 'INBOX' ? 'Incoming email will appear here.' : 'Messages saved in this mailbox will appear here.'}
      </p>
    </div>{:else if page}<div class="mail-list">
      {#each messages as message (message.uid)}<button
          class="mail-row"
          class:unread={!message.read}
          onclick={() => open(message)}
          ><span class="mail-from">{mailbox === 'Sent' ? message.to : message.from}</span><span class="mail-subject"
            >{message.subject || 'No subject'}</span
          ><time>{new Date(message.date).toLocaleDateString()}</time></button
        >{/each}
    </div>
    {#if page?.nextCursor}<div class="more-button">
        <Button variant="secondary" loading={pending} onclick={() => load(true)}>Load earlier messages</Button>
      </div>{/if}{:else}<Button variant="secondary" onclick={() => load()}>Retry loading mailbox</Button>{/if}{/if}
<Dialog bind:open={forwardOpen} title="Forward email"
  ><form onsubmit={forward}>
    <div class="field">
      <label for="forward-email">Recipient</label><input
        id="forward-email"
        type="email"
        bind:value={forwardTo}
        required />
    </div>
    <Status message={error} kind="error" /><Button loading={pending} type="submit">Forward message</Button>
  </form></Dialog>
<Dialog bind:open={deleteOpen} title="Move message to junk"
  ><p>The message will leave {mailbox} and move to the junk mailbox.</p>
  <Status message={error} kind="error" />
  <div class="more-button">
    <Button variant="danger" loading={pending} onclick={remove}>Move to junk</Button>
  </div></Dialog>

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
  .mail-row.unread {
    border-left: 3px solid #8b80ff;
    font-weight: 600;
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
