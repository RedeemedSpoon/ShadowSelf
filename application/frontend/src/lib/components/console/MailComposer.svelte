<script lang="ts">
  import {onMount, untrack} from 'svelte';
  import type {Attachment, Email} from '$type';
  import {sanitizeEmailHtml} from '$utils/shared';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';

  let {
    initial,
    reply = false,
    pending = false,
    deliveryUncertain = false,
    onsubmit,
    oncancel,
  }: {
    initial?: Email;
    reply?: boolean;
    pending?: boolean;
    deliveryUncertain?: boolean;
    onsubmit: (content: Record<string, unknown>, save: boolean) => Promise<void>;
    oncancel: () => void;
  } = $props();
  let to = $state(
    untrack(() => (reply ? initial?.from.match(/<([^>]+)>/)?.[1] || initial?.from || '' : initial?.to || '')),
  );
  let subject = $state(
    untrack(() =>
      reply
        ? initial?.subject?.toLowerCase().startsWith('re:')
          ? initial.subject
          : `Re: ${initial?.subject || ''}`
        : initial?.subject || '',
    ),
  );
  let text = $state(untrack(() => (initial && !reply ? initial.body : '')));
  let html = $state(untrack(() => initial?.type === 'html' || !initial));
  let attachments = $state<Attachment[]>(
    untrack(() =>
      initial && !reply ? initial.attachments.filter((file): file is typeof file & Attachment => !!file.data) : [],
    ),
  );
  let error = $state('');
  const requestID = crypto.randomUUID();
  let container: HTMLDivElement;
  let editor = $state<import('quill').default>();

  $effect(() => {
    editor?.enable(!pending && !deliveryUncertain);
  });

  onMount(() => {
    let cancelled = false;
    void (async () => {
      const Quill = (await import('quill')).default;
      await import('quill/dist/quill.snow.css');

      if (cancelled) {
        return;
      }

      editor = new Quill(container, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{header: [1, 2, false]}],
            [{list: 'ordered'}, {list: 'bullet'}],
            ['link', 'blockquote'],
            ['clean'],
          ],
        },
      });

      if (initial && !reply) {
        if (initial.type === 'html') {
          editor.clipboard.dangerouslyPasteHTML(sanitizeEmailHtml(initial.body));
        } else {
          editor.setText(initial.body);
        }
      }
    })().catch(() => (error = 'The message editor could not be loaded. Use plain text or reload.'));

    return () => {
      cancelled = true;
    };
  });

  async function addFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    error = '';

    try {
      if (attachments.length + (input.files?.length || 0) > 10) {
        throw new Error('Attach up to 10 files per message.');
      }

      for (const file of Array.from(input.files || [])) {
        if (
          file.size > 10 * 1024 * 1024 ||
          attachments.reduce((sum, item) => sum + item.data.length, 0) + file.size * 1.34 > 18 * 1024 * 1024
        ) {
          throw new Error('Attachments must be under 10 MB each and 18 MB encoded total.');
        }

        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]);
          reader.onerror = () => reject(new Error('Could not read this file.'));
          reader.readAsDataURL(file);
        });
        attachments = [
          ...attachments,
          {filename: file.name, data, contentType: file.type || 'application/octet-stream'},
        ];
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not attach the file.';
    }

    input.value = '';
  }

  async function send(save: boolean) {
    const body = html ? editor?.getSemanticHTML() : text;
    const recipient = document.getElementById('mail-to') as HTMLInputElement;

    if (!save && !recipient.reportValidity()) {
      error = 'Enter a valid recipient email address.';

      return;
    }

    const content = html ? editor?.getText().trim() : text.trim();

    if (!save && !content) {
      error = 'Write a message before sending.';

      return;
    }

    const inReplyTo = reply ? initial?.messageID : initial?.inReplyTo;
    await onsubmit(
      {
        requestID,
        to,
        subject,
        body: html ? sanitizeEmailHtml(body || '') : body,
        type: html ? 'html' : 'text',
        attachments,
        inReplyTo,
        references: inReplyTo ? [...(initial?.references || []), inReplyTo] : [],
        draft: initial && !reply ? initial.uid : null,
      },
      save,
    );
  }
</script>

<div class="panel">
  <div class="form-grid">
    <div class="field">
      <label for="mail-to">To</label><input
        id="mail-to"
        type="email"
        bind:value={to}
        disabled={deliveryUncertain}
        autocomplete="off"
        required />
    </div>
    <div class="field">
      <label for="mail-subject">Subject</label><input
        id="mail-subject"
        bind:value={subject}
        disabled={deliveryUncertain}
        maxlength="126" />
    </div>
  </div>
  <div class="button-row editor-mode">
    <Button
      disabled={deliveryUncertain}
      variant={!html ? 'secondary' : 'quiet'}
      onclick={() => {
        if (html && editor) {
          text = editor.getText();
        }

        html = false;
      }}>Plain text</Button
    ><Button
      disabled={deliveryUncertain}
      variant={html ? 'secondary' : 'quiet'}
      onclick={() => {
        if (!html && editor) {
          editor.setText(text);
        }

        html = true;
      }}>Formatted message</Button>
  </div>
  <div class:hidden={!html} class="rich-editor"><div bind:this={container}></div></div>
  {#if !html}<div class="field">
      <label for="mail-text">Message</label><textarea
        id="mail-text"
        bind:value={text}
        disabled={deliveryUncertain}
        rows="12"></textarea>
    </div>{/if}
  <div class="attachment-area">
    <label for="mail-files">Attach files</label><input
      id="mail-files"
      type="file"
      disabled={deliveryUncertain}
      multiple
      onchange={addFiles} />{#each attachments as attachment, index (`${attachment.filename}-${index}`)}<div
        class="attachment-row">
        <span>{attachment.filename}</span><Button
          variant="quiet"
          icon="close"
          disabled={deliveryUncertain}
          aria-label="Remove {attachment.filename}"
          onclick={() => (attachments = attachments.filter((_, i) => i !== index))} />
      </div>{/each}
  </div>
  <Status message={error} kind="error" />
  <div class="button-row">
    <Button icon="send" loading={pending} onclick={() => send(false)}
      >{deliveryUncertain ? 'Check delivery status' : 'Send message'}</Button
    ><Button variant="secondary" disabled={pending || deliveryUncertain} onclick={() => send(true)}>Save draft</Button
    ><Button variant="quiet" disabled={pending} onclick={oncancel}>Cancel</Button>
  </div>
</div>

<style>
  .editor-mode {
    margin-bottom: 15px;
  }
  .rich-editor {
    margin-bottom: 20px;
  }
  .rich-editor :global(.ql-toolbar),
  .rich-editor :global(.ql-container) {
    border-color: color-mix(in srgb, var(--accent-light) 18.82%, transparent);
    background: #070e1c;
    color: #c6d1e9;
  }
  .rich-editor :global(.ql-container) {
    min-height: 260px;
    font-size: 14px;
  }
  .rich-editor :global(.ql-stroke) {
    stroke: #a8b5d0;
  }
  .rich-editor :global(.ql-fill) {
    fill: #a8b5d0;
  }
  .rich-editor :global(.ql-picker) {
    color: #a8b5d0;
  }
  .rich-editor :global(.ql-picker-options) {
    background: #0e1629;
  }
  .attachment-area {
    font-size: 12px;
    margin: 20px 0;
  }
  .attachment-area label {
    display: block;
    margin-bottom: 10px;
  }
  .attachment-area input {
    font-size: 12px;
    max-width: 100%;
  }
  .attachment-row {
    display: flex;
    align-items: center;
    gap: 15px;
    color: #a3b3d0;
  }
  .hidden {
    display: none;
  }
</style>
