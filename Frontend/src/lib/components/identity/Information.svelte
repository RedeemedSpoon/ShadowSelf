<script lang="ts">
  import {EditIcon, TrashIcon, CancelIcon} from '$icon';
  import {ActionIcon, CopyButton} from '$component';
  import type {FullIdentity} from '$type';

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
    <ActionIcon icon={CancelIcon} action={() => {}} title="Cancel Identity" />
    <ActionIcon icon={TrashIcon} action={() => {}} title="Delete Identity" />
  </div>
</section>
<section class="flex w-full items-start justify-evenly gap-8">
  <div>
    <div>
      <img src={`data:image/png;base64,${identity.picture}`} alt="{identity.name}'s profile picture" />
      <h3 class="mt-4 !text-2xl">{identity.name}</h3>
      <p>
        {identity.bio} Lorem, ipsum dolor sit amet consectetur adipisicing elit. Obcaecati officia laborum ipsum culpa! Ratione illo earum
        rerum magni nisi maiores tempora laudantium adipisci quasi aliquam, voluptatum nostrum consectetur iusto numquam!
      </p>
      <p>Created : {date}</p>
    </div>
    <div>
      <h3>Physical Details</h3>
      <p>age : {identity.age}</p>
      <p>sex : {identity.sex}</p>
      <p>ethnicity: {identity.ethnicity}</p>
      <p>location: {identity.location}</p>
      <p>IP: {identity.proxy_server}</p>
    </div>
  </div>
  <div>
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
  </div>
</section>

<style lang="postcss">
  img {
    @apply h-[15vh] w-[15vh] rounded-full object-cover;
  }

  h3 {
    @apply text-3xl text-neutral-300;
  }

  section > div:not(#top-icons) {
    @apply flex flex-col items-start justify-start gap-4;
  }
</style>
