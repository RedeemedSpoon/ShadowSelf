<script lang="ts">
  import {CopyIcon, CreditCardIcon, DownloadIcon, EditIcon, EmailIcon, PhoneIcon} from '$icon';
  import {toTitleCase, base64ToBlob, formatPhoneNumber} from '$lib';
  import {ActionIcon, CopyButton, ReactiveButton} from '$component';
  import type {FullIdentity} from '$type';

  let {identity}: {identity: FullIdentity} = $props();

  const relativeDate = new Date(identity.creation_date).getTime() - new Date().getTime();
  const dateInDays = Math.round(relativeDate / (1000 * 60 * 60 * 24));
  const dateInMonth = Math.round(dateInDays / 30);

  const rtf1 = new Intl.RelativeTimeFormat('en', {style: 'short'});
  const date = Math.abs(dateInMonth) > 1 ? rtf1.format(dateInMonth, 'months') : rtf1.format(dateInDays, 'days');

  function copyImage() {
    const blob = base64ToBlob(identity.picture);
    navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
  }

  function downloadImage() {
    const blob = base64ToBlob(identity.picture);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.download = `${identity.name.replace(' ', '_').replace('.', '')}.png`;
    link.href = url;
    link.click();
  }
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">General Information</h2>
  <div id="top-icons" class="flex gap-2">
    <ActionIcon icon={EditIcon} action={() => {}} title="Change Information" />
  </div>
</section>
<section class="m-12 grid grid-cols-2 place-items-center gap-16">
  <div class="group relative cursor-pointer">
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
    <img class="rounded-xl" src={`data:image/png;base64,${identity.picture}`} alt="{identity.name}'s profile picture" />
  </div>
  <div class="flex flex-col gap-2 text-nowrap">
    <h3 class="mt-4 !text-3xl">{identity.name}, {identity.age}</h3>
    <p class="text-lg text-neutral-500">{toTitleCase(identity.ethnicity)} {toTitleCase(identity.sex)}</p>
    <p>{identity.bio}</p>
    <p class="flex items-center gap-2 text-nowrap">
      Located in
      <img class="h-[24px]" src={`https://flagsapi.com/${identity.location.split(',')[0]}/flat/24.png`} alt={identity.location} />
      {identity.location.split(',')[1]}, {identity.location.split(',')[2]} ({identity.proxy_server})
    </p>
    <p>Created {date}</p>
    <div id="info" class="flex flex-col">
      <div>
        <EmailIcon fill={true} className="text-neutral-300 cursor-default" />
        <CopyButton alt={true} change={false} text={identity.email} />
      </div>
      <div>
        <PhoneIcon fill={true} className="text-neutral-300 cursor-default" />
        <CopyButton alt={true} change={false} text={formatPhoneNumber(identity.phone)} />
      </div>
      <div>
        <CreditCardIcon fill={true} className="text-neutral-300 cursor-default" />
        <CopyButton alt={true} change={false} text={identity.card.toString().replace(/\d{4}(?=\d)/g, '$& ')} />
      </div>
    </div>
  </div>
</section>

<style lang="postcss">
  #overlay-profile {
    @apply absolute inset-0 h-full w-full rounded-xl transition-all duration-300;
    @apply group-hover:bg-black/40 group-hover:shadow-[inset_0_0_50px_10px_#00000080];
  }

  #info > div {
    @apply flex items-center gap-6;
  }

  h3 {
    @apply text-3xl text-neutral-300;
  }
</style>
