<script lang="ts">
  import {onMount} from 'svelte';

  interface Props {
    saveDraft: () => void;
    sendEmail: () => void;
  }

  let {saveDraft, sendEmail}: Props = $props();

  onMount(async () => {
    const Quill = (await import('quill')).default;
    await import('quill/dist/quill.snow.css');

    const quill = new Quill('#editor', {
      modules: {toolbar: '#toolbar-container'},
      theme: 'snow',
    });

    document.querySelectorAll('#toolbar-container *').forEach((element) => {
      if (element.classList.contains('ql-stroke')) element.classList.add('!stroke-neutral-300');
      if (element.classList.contains('ql-fill')) element.classList.add('!fill-neutral-300');
      if (element.classList.contains('ql-picker')) element.classList.add('!text-neutral-300');
      if (element.classList.contains('ql-picker-label')) element.classList.add('hover:!text-neutral-300');
      if (element.classList.contains('ql-picker-options')) element.classList.add('!bg-neutral-900');
      if (element.classList.contains('ql-picker-item')) {
        element.classList.add('!text-neutral-300');
        element.classList.add('hover:!text-neutral-500');
      }
    });
  });
</script>

<div id="toolbar-container">
  <span class="ql-formats">
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
    <button class="ql-image" aria-label="Insert image"></button>
    <button class="ql-video" aria-label="Insert video"></button>
    <button class="ql-formula" aria-label="Insert formula"></button>
  </span>
  <span class="ql-formats">
    <button class="ql-clean" aria-label="Clear formatting"></button>
  </span>
</div>
<div id="editor"></div>
<button onclick={saveDraft}>Save Draft</button>
<button onclick={sendEmail}>Send Email</button>

<style lang="postcss">
  #editor {
    @apply !h-[40vh] !min-h-96 rounded-b-xl border-neutral-800 bg-neutral-800/30 text-neutral-300;
  }

  #toolbar-container {
    @apply rounded-t-xl border-neutral-800 bg-neutral-800;
  }

  #toolbar-container button {
    @apply shadow-none;
  }
</style>
