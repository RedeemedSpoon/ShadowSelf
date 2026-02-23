<script lang="ts">
  import {CopyIcon, WalletIcon, DownloadIcon, EmailIcon, PhoneIcon, EditIcon, BackIcon} from '$icon';
  import {ActionIcon, CopyButton, ReactiveButton} from '$component';
  import {toTitleCase, formatPhoneNumber, formatUSD} from '$format';
  import {currentSection, identity} from '$store';
  import {base64ToBlob, notify} from '$lib';
  import {countriesFlags} from '$image';
  import {fetchAPI} from '$fetch';

  import InformationEdit from './sub-components/InformationEdit.svelte';

  let activeStatus = $state(false);
  let isEditingMode = $state(false);

  const relativeDate = new Date($identity.creationDate).getTime() - new Date().getTime();
  const dateInDays = Math.round(relativeDate / (1000 * 60 * 60 * 24));
  const dateInMonths = Math.round(dateInDays / 30);

  const rtf1 = new Intl.RelativeTimeFormat('en', {style: 'short'});
  const date = Math.abs(dateInMonths) > 1 ? rtf1.format(dateInMonths, 'months') : rtf1.format(dateInDays, 'days');

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
      const age = Number((document.querySelector('input[name="age"]') as HTMLInputElement).value.trim());
      const ethnicity = (document.querySelector('input[name="ethnicity"]') as HTMLSelectElement).value;
      const sex = document.querySelector('.selected')?.id;

      const body = {picture, name, bio, age, ethnicity, sex};
      const response = await fetchAPI('identity/update-information', 'PUT', body);
      if (response.err) return notify(response.err, 'alert');

      $identity = {...$identity, ...response};
      isEditingMode = false;
      activeStatus = false;
    } else {
      isEditingMode = true;
      activeStatus = true;
    }
  }
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-2xl font-bold text-neutral-300 sm:text-4xl md:text-5xl">General Information</h1>
  <div id="top-icons" class="flex gap-2">
    <div class:hidden={!isEditingMode}>
      <ActionIcon icon={BackIcon} action={() => ((isEditingMode = false), (activeStatus = false))} title="Ignore Changes" />
    </div>
    <ActionIcon commit={true} icon={EditIcon} action={updateInformation} title="Update Information" {activeStatus} />
  </div>
</section>

{#if isEditingMode}
  <InformationEdit />
{:else}
  <section class="flex items-center gap-8 max-lg:flex-col sm:m-12 xl:gap-16 2xl:gap-24">
    <div class="group relative sm:w-3/4 lg:w-1/2">
      <div id="overlay-profile"></div>
      <ReactiveButton
        text="Copy Image"
        newText="Copied!"
        callback={copyImage}
        icon={CopyIcon}
        upperClassname="group/copy absolute max-xl:left-12! right-12 px-0 py-0 group-hover:opacity-100 bottom-8 opacity-0"
        className="group-hover/copy:text-neutral-400! text-neutral-100"
        iconClassname="text-neutral-100 group-hover/copy:text-neutral-400" />
      <ReactiveButton
        text="Download Image"
        newText="Downloaded!"
        callback={downloadImage}
        icon={DownloadIcon}
        upperClassname="group/copy absolute left-12 px-0 py-0 group-hover:opacity-100 max-xl:bottom-20 xl:bottom-8 opacity-0"
        className="group-hover/copy:text-neutral-400! text-neutral-100"
        iconClassname="text-neutral-100 group-hover/copy:text-neutral-400" />
      {#key currentSection}
        <img
          id="pic"
          loading="lazy"
          class="min-w-[350px] rounded-xl max-md:w-3/4 xl:min-w-[400px] 2xl:min-w-[500px]"
          src={`data:image/png;base64,${$identity.picture}`}
          alt="{$identity.name}'s profile picture" />
      {/key}
    </div>
    <div class="flex flex-col gap-2 text-nowrap lg:w-1/2">
      <h3 class="mt-4 text-3xl!">{$identity.name}, {$identity.age}</h3>
      <p class="text-lg text-neutral-500">{toTitleCase($identity.ethnicity)} {toTitleCase($identity.sex)}</p>
      <p>{$identity.bio}</p>
      <hr class="my-2 w-1/6" />
      <p class="flex items-center gap-2 md:text-nowrap">
        Located in
        <img class="h-4 max-md:hidden" src={countriesFlags[$identity.location.split(',')[0].toLowerCase()]} alt={$identity.location} />
        {$identity.location.split(',')[1]}, {$identity.location.split(',')[2]} ({$identity.proxyServer})
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
          <WalletIcon fill={true} className="text-primary-700 cursor-default" />
          <CopyButton
            alt={true}
            change={false}
            text={Number($identity.walletFunds).toFixed(2)}
            label={formatUSD(Number($identity.walletFunds))} />
        </div>
      </div>
    </div>
  </section>
{/if}

<style lang="postcss">
  @reference "$style";

  #overlay-profile {
    @apply absolute inset-0 h-full w-full min-w-[350px] rounded-xl transition-all duration-300 max-md:w-3/4;
    @apply group-hover:bg-black/40 group-hover:shadow-[inset_0_0_50px_10px_#00000080] xl:min-w-[400px] 2xl:min-w-[500px];
  }

  #information > div {
    @apply flex items-center gap-6;
  }

  h3 {
    @apply text-3xl text-neutral-300;
  }
</style>
