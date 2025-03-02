<script lang="ts">
  import {ActionIcon, CopyButton} from '$component';
  import type {FullIdentity} from '$type';
  import {toTitleCase} from '$lib';
  import {EditIcon} from '$icon';

  let {identity}: {identity: FullIdentity} = $props();

  const relativeDate = new Date(identity.creation_date).getTime() - new Date().getTime();
  const dateInDays = Math.round(relativeDate / (1000 * 60 * 60 * 24));
  const dateInMonth = Math.round(dateInDays / 30);

  const rtf1 = new Intl.RelativeTimeFormat('en', {style: 'short'});
  const date = Math.abs(dateInMonth) > 1 ? rtf1.format(dateInMonth, 'months') : rtf1.format(dateInDays, 'days');
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h2 class="text-5xl text-neutral-300">General Information</h2>
  <div id="top-icons" class="flex gap-2">
    <ActionIcon icon={EditIcon} action={() => {}} title="Change Information" />
  </div>
</section>
<section class="m-12 grid grid-cols-2 place-items-center gap-16">
  <div class="relative cursor-pointer">
    <div id="overlay-profile"></div>
    <img class="rounded-xl" src={`data:image/png;base64,${identity.picture}`} alt="{identity.name}'s profile picture" />
  </div>
  <div class="flex flex-col gap-2 text-nowrap">
    <h3 class="mt-4 !text-2xl">{identity.name}, {identity.age}</h3>
    <p class="text-lg text-neutral-500">{toTitleCase(identity.ethnicity)} {toTitleCase(identity.sex)}</p>
    <p>ipsum dolor sit amet consectetur adipisicing elit. Obcaecati officia laborum ipsum culpa!</p>
    <p class="flex items-center gap-2 text-nowrap">
      Located in
      <img class="h-[24px]" src={`https://flagsapi.com/${identity.location.split(',')[0]}/flat/24.png`} alt={identity.location} />
      {identity.location.split(',')[1]}, {identity.location.split(',')[2]} ({identity.proxy_server})
    </p>
    <p>Created {date}</p>
    <CopyButton text={identity.email} />
    <CopyButton text={identity.phone} />
    <CopyButton text={identity.card.toString()} />
  </div>
</section>

<style lang="postcss">
  #overlay-profile {
    @apply absolute inset-0 h-full w-full rounded-xl transition-all duration-300 hover:bg-black/20 hover:shadow-[inset_0_0_50px_10px_#00000090];
  }

  h3 {
    @apply text-3xl text-neutral-300;
  }
</style>
