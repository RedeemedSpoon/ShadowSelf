<script lang="ts">
  import DOMPurify from 'dompurify';
  import {base64ToBlob} from '$lib';
  import {target} from '$store';

  let iframe = $state() as HTMLIFrameElement | null;
</script>

{#if $target?.type === 'html'}
  <iframe
    bind:this={iframe}
    title={$target.subject}
    srcdoc={DOMPurify.sanitize($target.body)}
    class="h-[40vh] w-full overflow-y-hidden bg-neutral-100"
    onload={() => ((iframe!.style.height = iframe!.contentWindow!.document.body.scrollHeight + 70 + 'px'), window.scrollTo(0, 0))}
    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
{:else}
  <p class="whitespace-pre-line p-8">{$target?.body}</p>
{/if}

{#if $target?.attachments?.length && $target?.attachments.length > 0}
  <div class="flex flex-col gap-4 p-4">
    <h3 class="!text-2xl text-neutral-300">Attachments:</h3>
    {#each $target.attachments as attachment}
      <a href={URL.createObjectURL(base64ToBlob(attachment.data, 'application/octet-stream'))} download={attachment.filename}>
        {attachment.filename}</a>
    {/each}
  </div>
{/if}
