<script lang="ts">
  import {CopyIcon, CreditCardIcon, DownloadIcon, EmailIcon, PhoneIcon} from '$icon';
  import {currentSection, identity, fetchIndex, handleResponse} from '$store';
  import InformationEdit from './sub-components/InformationEdit.svelte';
  import {toTitleCase, base64ToBlob, formatPhoneNumber} from '$lib';
  import {ActionIcon, CopyButton, ReactiveButton} from '$component';
  import type {WebSocketResponse} from '$type';
  import {EditIcon, BackIcon} from '$icon';

  let {ws}: {ws: WebSocket} = $props();

  let activeStatus = $state(false);
  let isEditingMode = $state(false);

  const relativeDate = new Date($identity.creation_date).getTime() - new Date().getTime();
  const dateInDays = Math.round(relativeDate / (1000 * 60 * 60 * 24));
  const dateInMonth = Math.round(dateInDays / 30);

  const rtf1 = new Intl.RelativeTimeFormat('en', {style: 'short'});
  const date = Math.abs(dateInMonth) > 1 ? rtf1.format(dateInMonth, 'months') : rtf1.format(dateInDays, 'days');

  function copyImage() {
    const blob = base64ToBlob($identity.picture);
    navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
  }

  function downloadImage() {
    const blob = base64ToBlob($identity.picture);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.download = `${$identity.name.replace(' ', '_').replace('.', '')}.png`;
    link.href = url;
    link.click();
  }

  async function updateInformation() {
    if (isEditingMode) {
      const picture = (document.querySelector('#profile') as HTMLImageElement)!.src.split('data:image/png;base64,')[1];
      const name = (document.querySelector('input[name="name"]') as HTMLInputElement).value.trim();
      const bio = (document.querySelector('textarea') as HTMLTextAreaElement).value.trim();
      const age = (document.querySelector('input[name="age"]') as HTMLInputElement).value.trim();
      const ethnicity = (document.querySelector('input[name="ethnicity"]') as HTMLSelectElement).value;
      const sex = document.querySelector('.selected')?.id;

      ws.send(JSON.stringify({type: 'update-information', picture, name, bio, age, ethnicity, sex}));
    } else {
      isEditingMode = true;
      activeStatus = true;
    }
  }

  $handleResponse = (response: WebSocketResponse) => {
    switch (response.type) {
      case 'regenerate-name': {
        const element = document.querySelector(`input[name="name"]`) as HTMLInputElement;
        element.value = response.name!;
        break;
      }

      case 'regenerate-bio': {
        const element = document.querySelector(`textarea`) as HTMLTextAreaElement;
        element.value = response.bio!;
        break;
      }

      case 'regenerate-picture': {
        const element = document.querySelector(`#profile`) as HTMLImageElement;
        element.src = `data:image/png;base64,${response.picture}`;
        $fetchIndex = 0;
        break;
      }

      case 'update-information': {
        $identity = {...$identity, ...response};
        isEditingMode = false;
        activeStatus = false;
        break;
      }
    }
  };
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-5xl font-bold text-neutral-300">General Information</h1>
  <div id="top-icons" class="flex gap-2">
    <div class:hidden={!isEditingMode}>
      <ActionIcon icon={BackIcon} action={() => ((isEditingMode = false), (activeStatus = false))} title="Ignore Changes" />
    </div>
    <ActionIcon commit={true} icon={EditIcon} action={updateInformation} title="Update Information" {activeStatus} />
  </div>
</section>
{#if isEditingMode}
  <InformationEdit {ws} />
{:else}
  <section class="m-12 grid grid-cols-2 place-items-center gap-16">
    <div class="group relative">
      <div id="overlay-profile"></div>
      <ReactiveButton
        text="Copy Image"
        newText="Copied!"
        callback={copyImage}
        icon={CopyIcon}
        upperClassname="group/copy absolute right-12 px-0 py-0 group-hover:opacity-100 bottom-8 opacity-0"
        className="group-hover/copy:!text-neutral-400 text-neutral-100"
        iconClassname="text-neutral-100 group-hover/copy:text-neutral-400" />
      <ReactiveButton
        text="Download Image"
        newText="Downloaded!"
        callback={downloadImage}
        icon={DownloadIcon}
        upperClassname="group/copy absolute left-12 px-0 py-0 group-hover:opacity-100 bottom-8 opacity-0"
        className="group-hover/copy:!text-neutral-400 text-neutral-100"
        iconClassname="text-neutral-100 group-hover/copy:text-neutral-400" />
      {#key currentSection}
        <img
          loading="lazy"
          class="rounded-xl"
          id="pic"
          src={`data:image/png;base64,${$identity.picture}`}
          alt="{$identity.name}'s profile picture" />
      {/key}
    </div>
    <div class="flex flex-col gap-2 text-nowrap">
      <h3 class="mt-4 !text-3xl">{$identity.name}, {$identity.age}</h3>
      <p class="text-lg text-neutral-500">{toTitleCase($identity.ethnicity)} {toTitleCase($identity.sex)}</p>
      <p>{$identity.bio}</p>
      <hr class="my-2 w-1/6" />
      <p class="flex items-center gap-2 text-nowrap">
        Located in
        <img class="h-[22px]" src={`https://flagsapi.com/${$identity.location.split(',')[0]}/flat/24.png`} alt={$identity.location} />
        {$identity.location.split(',')[1]}, {$identity.location.split(',')[2]} ({$identity.proxy_server})
      </p>
      <p class="-mt-2">Created {date}</p>
      <hr class="my-2 w-1/6" />
      <div id="information" class="flex flex-col">
        <div>
          <EmailIcon fill={true} className="text-primary-700 cursor-default" />
          <CopyButton alt={true} change={false} text={$identity.email} />
        </div>
        <div>
          <PhoneIcon fill={true} className="text-primary-700 cursor-default" />
          <CopyButton alt={true} change={false} text={formatPhoneNumber($identity.phone)} />
        </div>
        <div>
          <CreditCardIcon fill={true} className="text-primary-700 cursor-default" />
          <CopyButton alt={true} change={false} text={$identity.card.toString().replace(/\d{4}(?=\d)/g, '$& ')} />
        </div>
      </div>
    </div>
  </section>
{/if}

<style lang="postcss">
  #overlay-profile {
    @apply absolute inset-0 h-full w-full rounded-xl transition-all duration-300;
    @apply group-hover:bg-black/40 group-hover:shadow-[inset_0_0_50px_10px_#00000080];
  }

  #information > div {
    @apply flex items-center gap-6;
  }

  h3 {
    @apply text-3xl text-neutral-300;
  }
</style>
