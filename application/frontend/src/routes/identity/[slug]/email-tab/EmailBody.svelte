<script lang="ts">
  import ExternalLinkIcon from '$icon/navigation/ExternalLink.svelte';
  import AttachmentIcon from '$icon/communication/Attachment.svelte';
  import {base64ToBlob} from '$utils/shared';
  import DOMPurify from 'dompurify';
  import type {Email} from '$type';

  let {email}: {email: Email} = $props();

  let iframe = $state() as HTMLIFrameElement | null;

  function openInNewTab() {
    const blob = new Blob([email.type === 'html' ? DOMPurify.sanitize(email.body) : email.body], {
      type: email.type === 'html' ? 'text/html' : 'text/plain',
    });

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
</script>

<div class="mt-8 mb-6 flex flex-col gap-4 md:mx-4">
  <div class="flex flex-col justify-between gap-4 md:flex-row md:items-start">
    <div class="flex-1">
      <h3 class="text-2xl font-semibold text-neutral-200">{email.subject || '(No Subject)'}</h3>
      <p class="mt-1 text-sm text-neutral-500">{new Date(email.date).toLocaleString()}</p>
    </div>
    <div class="flex flex-col gap-1 md:text-right">
      <p class="text-sm text-neutral-400"><span class="text-neutral-600">From:</span> {email.from}</p>
      <p class="text-sm text-neutral-400"><span class="text-neutral-600">To:</span> {email.to}</p>
    </div>
  </div>
</div>

<div class="relative mb-6 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm">
  {#if email?.type === 'html'}
    <div class="bg-white p-4">
      <iframe
        bind:this={iframe}
        title={email.subject}
        srcdoc={DOMPurify.sanitize(email.body)}
        class="min-h-[50vh] w-full overflow-y-hidden"
        onload={() => {
          if (iframe?.contentWindow?.document.body) {
            iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 50 + 'px';
          }
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
    </div>
  {:else}
    <div class="min-h-[20vh] bg-neutral-800/50 px-8 py-6">
      <p class="font-mono text-sm leading-relaxed whitespace-pre-wrap text-neutral-300">{email?.body}</p>
    </div>
  {/if}
</div>

<div class="flex flex-col justify-between gap-6 md:flex-row md:items-center">
  <div class="flex-1">
    {#if email?.attachments?.length && email?.attachments.length > 0}
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-medium text-neutral-400">
          {email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}
        </h3>
        <div class="flex flex-wrap gap-3">
          {#each email.attachments as attachment, id (id)}
            <a
              href={URL.createObjectURL(base64ToBlob(attachment.data, 'application/octet-stream'))}
              download={attachment.filename}
              class="attachment">
              <AttachmentIcon className="h-4 w-4" />
              <span class="max-w-50 truncate">{attachment.filename}</span>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <button onclick={openInNewTab} class="alt group mr-8 flex flex-row gap-2 px-0 py-0 text-sm">
    <ExternalLinkIcon className="h-5! w-5! stroke-primary-600 group-hover:stroke-primary-700 transition-all duration-300" />
    View in New Tab
  </button>
</div>

<style lang="postcss">
  @reference "$style";

  .attachment {
    @apply flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300;
    @apply transition-colors hover:bg-neutral-700 hover:text-white;
  }
</style>
