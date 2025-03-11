<script lang="ts">
  import {mailbox, shredder, file, pencil} from '$image';
  import {mode, target} from '$store';
  import type {FetchAPI} from '$type';

  interface Props {
    label: 'INBOX' | 'Sent' | 'Drafts' | 'Junk';
    inbox: FetchAPI['emails']['inbox'];
    loadMore: () => void;
    count: number;
  }

  let {count, inbox, label, loadMore}: Props = $props();
</script>

{#if count > 0 && inbox.length > 0}
  {#each inbox as email}
    <div
      aria-hidden="true"
      class="container {$target?.messageID === email.messageID && 'target'}"
      onclick={() => ($target?.messageID === email.messageID && ($mode = 'read'), ($target = email))}>
      <div class="w-1/2">
        <h3 class="truncate !text-2xl text-neutral-300">{email.subject}</h3>
        <p class="text-sm text-neutral-500">{email.date}</p>
      </div>
      <div class="w-1/2">
        <p class="text-right text-sm text-neutral-400">{email.from}</p>
      </div>
    </div>
  {/each}
  {#if inbox.length < count}
    <button class="load-more" onclick={loadMore}>Load More</button>
  {/if}
{:else if label === 'INBOX'}
  <section class="no-emails" style="background-image: url({mailbox});">
    <h3 class="mt-12">No Emails Received</h3>
    <p class="w-1/2 text-center">
      Looks like no emails have been sent to this email address yet. Maybe it's a good idea to send one to kick things off?
    </p>
    <button onclick={() => ($mode = 'write')}>Send Email</button>
  </section>
{:else if label === 'Sent'}
  <section class="no-emails" style="background-image: url({pencil});">
    <h3 class="mt-12">No Emails Sent</h3>
    <p class="w-1/2 text-center">It looks like you haven't sent any emails from this account yet. Why not start by writing one now?</p>
    <button onclick={() => ($mode = 'write')}>Compose Email</button>
  </section>
{:else if label === 'Drafts'}
  <section class="no-emails" style="background-image: url({file});">
    <h3 class="mt-12">No Drafts</h3>
    <p class="w-1/2 text-center">
      Looks like you don’t have any drafts at the moment. Start writing an email and save it as a draft to come back to later!
    </p>
    <button onclick={() => ($mode = 'write')}>Write Draft</button>
  </section>
{:else if label === 'Junk'}
  <section class="no-emails" style="background-image: url({shredder});">
    <h3 class="mt-12">No Junk :)</h3>
    <p class="w-1/2 text-center">No junk emails here! Keep it that way by sending only the emails you care about to your inbox.</p>
  </section>
{/if}

<style lang="postcss">
  .no-emails {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  .container {
    @apply flex cursor-pointer items-center border-b border-neutral-700 px-8 py-4 last:border-none hover:bg-neutral-400/5;
  }

  .target {
    @apply bg-neutral-300/10 hover:bg-neutral-300/10;
  }

  .load-more {
    @apply relative z-20 w-full from-neutral-950 to-neutral-950/10 shadow-none;
  }

  h3 {
    @apply text-5xl text-neutral-300;
  }
</style>
