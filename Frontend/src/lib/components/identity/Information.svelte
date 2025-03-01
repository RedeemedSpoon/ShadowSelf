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
<section class="mx-8 flex items-center gap-4">
  <div class="w-[30rem]">
    <img id="profile" src={`data:image/png;base64,${identity.picture}`} alt="{identity.name}'s profile picture" />
    <h3 class="mt-4 !text-2xl">{identity.name}</h3>
    <p>ipsum dolor sit amet consectetur adipisicing elit. Obcaecati officia laborum ipsum culpa!</p>
    <p>Created {date}</p>
  </div>
  <div class="w-fit text-nowrap">
    <h3 class="mb-4">Physical Details</h3>
    <p>Age : {identity.age}</p>
    <p>Sex : {toTitleCase(identity.sex)}</p>
    <p>Ethnicity : {toTitleCase(identity.ethnicity)}</p>
    <p class="flex items-center gap-2 text-nowrap">
      Location :
      <img class="h-[24px]" src={`https://flagsapi.com/${identity.location.split(',')[0]}/flat/24.png`} alt={identity.location} />
      {identity.location.split(',')[1]}, {identity.location.split(',')[2]}
    </p>
    <p>IP : {identity.proxy_server}</p>
  </div>
</section>
<section class="mx-8 grid grid-cols-2 gap-4">
  <div>
    <h3>Email Address</h3>
    <CopyButton text={identity.email} />
  </div>
  <div>
    <h3>Phone Number</h3>
    <CopyButton text={identity.phone} />
  </div>
  <div>
    <h3>Virtual Card</h3>
    <CopyButton text={identity.card.toString()} />
  </div>
  <div>
    <h3>Online Accounts</h3>
  </div>
</section>

<style lang="postcss">
  #profile {
    @apply h-[15vh] w-[15vh] rounded-full object-cover;
  }

  h3 {
    @apply text-3xl text-neutral-300;
  }

  section.grid > div {
    @apply mx-8 flex flex-col gap-4;
  }
</style>
