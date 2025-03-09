<script lang="ts">
  import {mode, target} from '$store';
  import type {FetchAPI} from '$type';
  import {mailbox} from '$image';

  interface Props {
    label: 'INBOX' | 'Sent' | 'Drafts' | 'Junk';
    inbox: FetchAPI['emails']['inbox'];
    count: number;
  }

  let {count, inbox, label}: Props = $props();
</script>

{#if count > 0}
  {#each inbox as email}
    <div
      aria-hidden="true"
      class="container {$target?.messageID === email.messageID && 'target'}"
      onclick={() => ($target?.messageID === email.messageID && ($mode = 'read'), ($target = email))}>
      <div class="w-1/2">
        <h3 class="truncate !text-2xl text-neutral-300">{email.subject}</h3>
        <p class="text-sm text-neutral-500">{email.date}</p>
      </div>
      <p class="w-1/2 text-right text-sm text-neutral-400">{email.from}</p>
    </div>
  {/each}
{:else if label === 'INBOX'}
  <section id="no-emails" style="background-image: url({mailbox});">
    <h3 class="mt-12">No Emails</h3>
    <p class="w-1/2 text-center">
      Looks like no emails have been sent to this email address yet. Maybe it's a good idea to send one to kick things off?
    </p>
    <button onclick={() => ($mode = 'write')}>Send Email</button>
  </section>
{:else if label === 'Sent'}
  <div></div>
{:else if label === 'Junk'}
  <div></div>
{:else if label === 'Drafts'}
  <div></div>
{/if}

<style lang="postcss">
  #no-emails {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  .container {
    @apply flex cursor-pointer items-center border-b border-neutral-700 px-8 py-4 last:border-none hover:bg-neutral-400/5;
  }

  .target {
    @apply bg-neutral-300/10 hover:bg-neutral-300/10;
  }
</style>
