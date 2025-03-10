<script lang="ts">
  import type {FetchAPI} from '$type';
  import DOMPurify from 'dompurify';
  import {base64ToBlob} from '$lib';

  let iframe = $state() as HTMLIFrameElement | null;

  let {email}: {email: FetchAPI['emails']['inbox'][number]} = $props();
</script>

{#if email?.type === 'html'}
  <iframe
    bind:this={iframe}
    title={email.subject}
    srcdoc={DOMPurify.sanitize(email.body)}
    class="h-[40vh] w-full overflow-y-hidden bg-neutral-100"
    onload={() => ((iframe!.style.height = iframe!.contentWindow!.document.body.scrollHeight + 70 + 'px'), window.scrollTo(0, 0))}
    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
{:else}
  <p class="whitespace-pre-line p-8">{email?.body}</p>
{/if}

{#if email?.attachments?.length && email?.attachments.length > 0}
  <div class="flex flex-col gap-4 p-4">
    <h3 class="!text-2xl text-neutral-300">Attachments:</h3>
    {#each email.attachments as attachment}
      <a href={URL.createObjectURL(base64ToBlob(attachment.data, 'application/octet-stream'))} download={attachment.filename}>
        {attachment.filename}</a>
    {/each}
  </div>
{/if}
