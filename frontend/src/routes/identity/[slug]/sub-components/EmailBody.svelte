<script lang="ts">
  import {AttachmentIcon} from '$icon';
  import DOMPurify from 'dompurify';
  import {base64ToBlob} from '$lib';
  import type {Email} from '$type';

  let {email}: {email: Email} = $props();

  let iframe = $state() as HTMLIFrameElement | null;
</script>

<div class="mb-4 mt-8 flex justify-between max-md:flex-col md:mx-4 md:items-center">
  <div class="relative md:w-1/2">
    <h3 class="text-2xl! truncate text-neutral-300">{email.subject}</h3>
    <p class="text-sm text-neutral-500">{email.date}</p>
  </div>
  <div class="md:w-1/2">
    <p class="text-sm text-neutral-400 md:text-right">From: {email.from}</p>
    <p class="text-sm text-neutral-400 md:text-right">To: {email.to}</p>
  </div>
</div>
{#if email?.type === 'html'}
  <iframe
    bind:this={iframe}
    title={email.subject}
    srcdoc={DOMPurify.sanitize(email.body)}
    class="h-[40vh] w-full overflow-y-hidden rounded-lg bg-neutral-200"
    onload={() => ((iframe!.style.height = iframe!.contentWindow!.document.body.scrollHeight + 70 + 'px'), window.scrollTo(0, 0))}
    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
{:else}
  <p class="whitespace-pre-line rounded-lg bg-neutral-800 p-8 text-neutral-300">{email?.body}</p>
{/if}

{#if email?.attachments?.length && email?.attachments.length > 0}
  <div class="flex max-h-[10rem] flex-col gap-4 overflow-y-auto p-4">
    <h3 class="text-2xl! text-neutral-300">{email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}:</h3>
    {#each email.attachments as attachment}
      <a href={URL.createObjectURL(base64ToBlob(attachment.data, 'application/octet-stream'))} download={attachment.filename}>
        <AttachmentIcon className="w-6! h-6!" />{attachment.filename}</a>
    {/each}
  </div>
{/if}

<style lang="postcss">
  @reference "$style";

  a {
    @apply flex items-center gap-2;
  }
</style>
