<script lang="ts">
  import type {EditorParams, Email} from '$type';
  import type {Writable} from 'svelte/store';
  import {LoadingButton} from '$component';
  import {onMount} from 'svelte';

  interface Props {
    submit: (content: EditorParams, save: boolean, isdraft: boolean) => void;
    mode: Writable<'browse' | 'read' | 'write' | 'write-draft' | 'reply'>;
    target: Writable<Email | null>;
    isDraft: boolean;
  }

  let {submit, isDraft, target, mode}: Props = $props();

  let quill = $state() as {getSemanticHTML: () => string; getText: () => string; root: HTMLElement};
  let attachments = $state([]) as {filename: string; data: string}[];
  let isTypeHTML = $state(true) as boolean;
  let singleRun = $state(false) as boolean;

  function getRecipient() {
    if (!$target?.from) return '';
    return $target?.from.includes('<') ? $target.from!.match(/<([^>]+)>/)?.[1] : $target.from;
  }

  function parseContent() {
    const subject = (document.querySelector('input[name="subject"]') as HTMLInputElement)?.value;
    let body = isTypeHTML ? quill.getSemanticHTML() : quill.getText();
    if (body === '<p></p>') body = '';

    return {subject, body, attachments};
  }

  $effect(() => {
    if ($mode === 'read' || $mode === 'browse') singleRun = true;

    if ($mode === 'write' || $mode === 'reply') {
      if (quill?.root) quill.root.innerHTML = '';
      attachments = [];

      const recipient = document.querySelector('input[name="recipient"]') as HTMLInputElement;
      const subject = document.querySelector('input[name="subject"]') as HTMLInputElement;

      if (!$target) recipient.value = '';
      subject.value = '';
      subject.focus();
    }

    if (isDraft && singleRun && $target) {
      singleRun = false;
      quill.root.innerHTML = isTypeHTML ? $target.body : $target.body.replaceAll('\n', '<br>');

      const recipient = document.querySelector('input[name="recipient"]') as HTMLInputElement;
      const subject = document.querySelector('input[name="subject"]') as HTMLInputElement;

      recipient.value = $target.to;
      subject.value = $target.subject;
      attachments = [];

      for (const attachment of $target.attachments) {
        attachments = [...attachments, {filename: attachment.filename, data: attachment.data}];
      }
    }
  });

  onMount(async () => {
    const Quill = (await import('quill')).default;
    await import('quill/dist/quill.snow.css');

    quill = new Quill('#editor', {
      modules: {toolbar: '#toolbar-container'},
      theme: 'snow',
    });

    document.querySelectorAll('#toolbar-container *').forEach((element) => {
      if (element.classList.contains('ql-stroke')) element.classList.add('stroke-neutral-300!');
      if (element.classList.contains('ql-fill')) element.classList.add('fill-neutral-300!');
      if (element.classList.contains('ql-picker')) element.classList.add('text-neutral-300!');
      if (element.classList.contains('ql-picker-label')) element.classList.add('hover:text-neutral-300!');
      if (element.classList.contains('ql-picker-options')) element.classList.add('bg-neutral-900!');
      if (element.classList.contains('ql-picker-item')) {
        element.classList.add('text-neutral-300!');
        element.classList.add('hover:text-neutral-500!');
      }
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input.addEventListener('change', () => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          const buffer = event.target.result as ArrayBuffer;
          attachments = [...attachments, {filename: input.files![0].name, data: buffer.toString()}];
        }
      };

      reader.readAsDataURL(input.files![0]);
    });
  });
</script>

<div class:hidden={$mode === 'read' || $mode === 'browse'}>
  <div class="my-4 md:m-8">
    <div class="flex gap-8 max-md:relative max-md:flex-col md:items-center">
      <div class="flex flex-col gap-14">
        <label for="subject">Subject</label>
        <label class="max-md:mt-6" for="recipient">Recipient</label>
      </div>
      <div class="flex flex-col gap-6 max-md:absolute max-md:top-10">
        <input type="text" placeholder="Mail Subject" name="subject" />
        <input
          type="email"
          name="recipient"
          placeholder="example@domain.tld"
          value={getRecipient()}
          class="max-md:mt-4"
          disabled={$target && $mode !== 'write-draft'} />
      </div>
      <div class="flex w-full flex-col max-md:mt-12 md:items-end">
        <h3 class="mr-10 mb-2 text-xl font-semibold text-neutral-300">Body Type</h3>
        <div class="flex flex-row">
          <div class="box {!isTypeHTML && 'selected'}" onclick={() => (isTypeHTML = false)} aria-hidden="true">Raw Text</div>
          <div class="box {isTypeHTML && 'selected'}" onclick={() => (isTypeHTML = true)} aria-hidden="true">HTML</div>
        </div>
      </div>
    </div>
  </div>

  <div id="toolbar-container">
    <span class="ql-formats max-md:hidden!">
      <select class="ql-font"></select>
      <select class="ql-size"></select>
    </span>
    <span class="ql-formats">
      <button class="ql-bold" aria-label="Bold"></button>
      <button class="ql-italic" aria-label="Italic"></button>
      <button class="ql-underline" aria-label="Underline"></button>
      <button class="ql-strike" aria-label="Strikethrough"></button>
    </span>
    <span class="ql-formats">
      <select class="ql-color" aria-label="Text color"></select>
      <select class="ql-background" aria-label="Background color"></select>
    </span>
    <span class="ql-formats">
      <button class="ql-script" value="sub" aria-label="Subscript"></button>
      <button class="ql-script" value="super" aria-label="Superscript"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-header" value="1" aria-label="Heading 1"></button>
      <button class="ql-header" value="2" aria-label="Heading 2"></button>
      <button class="ql-blockquote" aria-label="Blockquote"></button>
      <button class="ql-code-block" aria-label="Code block"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-list" value="ordered" aria-label="Ordered list"></button>
      <button class="ql-list" value="bullet" aria-label="Bullet list"></button>
      <button class="ql-indent" value="-1" aria-label="Decrease indent"></button>
      <button class="ql-indent" value="+1" aria-label="Increase indent"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-direction" value="rtl" aria-label="Right to left"></button>
      <select class="ql-align" aria-label="Text alignment"></select>
    </span>
    <span class="ql-formats">
      <button class="ql-link" aria-label="Insert link"></button>
      <button class="ql-formula" aria-label="Insert formula"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-clean" aria-label="Clear formatting"></button>
    </span>
  </div>
  <div id="editor"></div>

  <div class="my-4 flex justify-between max-md:flex-col md:m-8">
    <div class="flex items-start gap-4 max-md:mb-12 max-md:justify-center">
      <div class="flex items-center gap-2">
        <label for="file">Attachments</label>
        <label id="file-upload"><input type="file" hidden />Upload</label>
      </div>
      <div class="max-h-24 flex-col overflow-y-auto">
        {#key attachments}
          {#each attachments as attachment (attachment.filename)}
            <div class="flex items-center gap-2">
              <p class="text-sm text-neutral-500">{attachment.filename}</p>
              <button
                class="alt px-2 py-1 text-sm"
                onclick={() => (attachments = attachments.filter((a) => a.filename !== attachment.filename))}>Remove</button>
            </div>
          {/each}
        {/key}
      </div>
    </div>

    <div class="flex h-fit gap-2 max-md:justify-center">
      <LoadingButton index={2} className="alt" onclick={() => submit(parseContent(), true, isDraft)}>Save Draft</LoadingButton>
      <LoadingButton onclick={() => submit(parseContent(), false, isDraft)}>Send {$target ? 'Reply' : 'Email'}</LoadingButton>
    </div>
  </div>
</div>

<style lang="postcss">
  @reference "$style";

  #editor {
    @apply !h-[50vh] !min-h-96 rounded-b-xl border-neutral-800 bg-neutral-800/30 text-neutral-300;
  }

  #toolbar-container {
    @apply flex rounded-t-xl border-neutral-800 bg-neutral-800;
  }

  #file-upload {
    @apply inline cursor-pointer self-center rounded-md bg-neutral-800 p-4 transition-opacity duration-300 hover:opacity-80;
  }

  label {
    @apply mr-2 text-neutral-300;
  }

  #toolbar-container button {
    @apply shadow-none;
  }

  #toolbar-container {
    @apply max-sm:grid max-sm:grid-cols-3;
  }

  input:disabled {
    @apply cursor-not-allowed opacity-50 select-none;
  }

  .box {
    @apply cursor-pointer border border-neutral-600 bg-neutral-800 px-4 py-2;
    @apply text-neutral-300 first:rounded-l-md last:rounded-r-md hover:bg-neutral-800/50;
  }

  .selected {
    @apply !bg-primary-600;
  }
</style>
