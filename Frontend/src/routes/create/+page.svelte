<script lang="ts">
  import {FlowStep, LoadingButton, SelectMenu, Tooltip, ExtensionLinks, Modal, InputWithIcon, ActionIcon} from '$component';
  import {InfoIcon, ExternalLinkIcon, MaleIcon, FemaleIcon, RepeatIcon, HappyIcon, LimitIcon} from '$icon';
  import {PhoneIcon, EmailIcon, CreditCardIcon, UserIcon, ExtensionIcon, PinIcon} from '$icon';
  import {currentStep, fetchIndex, modalIndex} from '$store';
  import {ublock, canvas, screenshot} from '$image';
  import type {CreationProcess} from '$type';
  import type {PageData} from './$types';
  import {goto} from '$app/navigation';
  import {dev} from '$app/environment';
  import {page} from '$app/state';
  import {notify} from '$lib';

  let {data}: {data: PageData} = $props();
  const ethnicities = ['Caucasian', 'Black', 'Hispanic', 'Latino', 'Arab', 'East asian', 'South asian'];

  let disabled = $state(true);
  let server = $state() as CreationProcess;
  let loaderInterval: unknown;
  let pingInterval: unknown;
  let ws: WebSocket | null;

  async function init() {
    if (data.cookie) initWebsocket();
    const loader = document.querySelector('#loader-process') as HTMLParagraphElement;

    loaderInterval = setInterval(() => {
      if (!loader) return;
      if (loader?.innerText.length === 3) loader!.innerText = '';
      else loader!.innerText += '.';
    }, 650);

    return new Promise((resolve, reject) => {
      setTimeout(() => (data.cookie && ws?.readyState !== 3 ? resolve(true) : reject()), 1950);
    });
  }

  async function initWebsocket() {
    const id = page.url.searchParams.get('id');
    ws = new WebSocket(`wss://${page.url.hostname}/ws-creation-process?id=${id}`);

    ws.onopen = () => {
      pingInterval = setInterval(() => ws?.send('ping'), 5000);
      reply('locations');
    };

    ws.onclose = (ws) => {
      clearInterval(pingInterval as number);
      if (ws.code === 1014) notify(ws.reason, 'alert');
    };

    ws.onmessage = async (event) => {
      if (Number(event.data) == event.data) return;
      if (event.data === 'pong') return;

      const response = JSON.parse(event.data) as CreationProcess;
      const oldFetch = $fetchIndex;
      $fetchIndex = 0;

      if (response?.error) return notify(response.error, 'alert');
      // if (response.sync) disabled = true;

      if (response.finish) {
        document.cookie = `creation-process=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${dev ? 'localhost' : 'shadowself.io'}`;
        return goto('/dashboard');
      }

      if (response?.repeat) {
        server.identity.name = response.repeat?.name || server.identity.name;
        server.identity.bio = response.repeat?.bio || server.identity.bio;
        return;
      }

      $currentStep = response.locations ? 1 : oldFetch !== 1 ? $currentStep : $currentStep + 1;
      server = response;
    };
  }

  async function respondServer() {
    if (![7, 8, 9].includes($currentStep)) {
      $fetchIndex = 1;
      await new Promise((resolve) => setTimeout(resolve, 650));
    }

    switch ($currentStep) {
      case 1: {
        const chosen = document.querySelector('.chosen') as HTMLDivElement;
        reply('identities', {location: chosen.id});
        break;
      }

      case 2: {
        const identity = {
          picture: server.identity.picture,
          ethnicity: (document.querySelector('input[name="ethnicity"]') as HTMLSelectElement).value,
          name: (document.querySelector('input[name="name"]') as HTMLInputElement).value.trim(),
          age: Number((document.querySelector('input[name="age"]') as HTMLInputElement).value.trim()),
          bio: document.querySelector('textarea')?.value.trim(),
          sex: document.querySelector('.selected')?.id,
        };

        reply('email', {identity});
        break;
      }

      case 3: {
        const email = document.querySelector('input[name="email"]') as HTMLInputElement;
        reply('phone', {email: email.value + '@shadowself.io'});
        break;
      }

      case 4: {
        const phone = document.querySelector('input[name="phone"]') as HTMLInputElement;
        reply('card', {phone: phone.value});
        break;
      }

      case 5:
        reply('extension', {card: server.card});
        break;

      case 6:
        reply('sync');
        break;

      case 7:
        $currentStep = 8;
        break;

      case 8:
        $currentStep = 9;
        break;

      case 9:
        $currentStep = 10;
        break;

      case 10:
        await new Promise((resolve) => setTimeout(resolve, 1350));
        clearInterval(loaderInterval as number);
        clearInterval(pingInterval as number);
        reply('finish');
        break;
    }
  }

  function reply(kind: string, body?: {[key: string]: unknown}) {
    ws?.send(JSON.stringify({kind, ...body}));
  }

  function handleEvent(kind: string, body?: unknown) {
    switch (kind) {
      case 'locations': {
        const all = document.querySelectorAll('.locations-box');
        all.forEach((element) => element.classList.remove('chosen'));

        const chosenElement = document.querySelector(`#${body}`) as HTMLDivElement;
        chosenElement.classList.add('chosen');
        disabled = false;
        break;
      }

      case 'sexes': {
        const all = document.querySelectorAll('.sex-box');
        all.forEach((element) => element.classList.remove('selected'));

        const chosenElement = document.querySelector(`#${body}`) as HTMLDivElement;
        chosenElement.classList.add('selected');
        break;
      }

      case 'repeat-bio': {
        reply('identities', {repeat: {bio: true}});
        break;
      }

      case 'repeat-name': {
        const sex = document.querySelector('.selected')?.id;
        reply('identities', {repeat: {name: true, sex}});
        break;
      }

      case 'identities': {
        $fetchIndex = 2;

        const regenerate = {
          ethnicity: (document.querySelector('input[name="ethnicity"]') as HTMLSelectElement).value,
          name: (document.querySelector('input[name="name"]') as HTMLInputElement).value,
          age: Number((document.querySelector('input[name="age"]') as HTMLInputElement).value),
          bio: document.querySelector('textarea')?.value,
          sex: document.querySelector('.selected')?.id,
        };

        reply('identities', {regenerate});
        break;
      }

      case 'sync':
        // disabled = false;
        break;
    }
  }
</script>

<svelte:head>
  <title>ShadowSelf - Create New Identity</title>
  <meta name="description" content="Create and customize your identity here quickly and efficiently to get started." />
</svelte:head>

<div id="create-identity">
  {#await init()}
    <div class="mx-auto flex flex-row items-center">
      <h3>Loading</h3>
      <h3 id="loader-process">.</h3>
    </div>
  {:then}
    <FlowStep {disabled} finalStep={10} handleClick={respondServer}>
      {#if $currentStep === 1}
        <h3>Choose your location</h3>
        <p class="lg:w-1/2">
          Choose the location of your synthetic identity. You will be able to access this location via our extension afterwards.
        </p>
        <div class="flex cursor-pointer flex-col">
          {#each server.locations as location}
            <div id={location.code} class="locations-box" onclick={() => handleEvent('locations', location.code)} aria-hidden="true">
              <img src="https://flagsapi.com/{location.code}/flat/48.png" alt="country flag" />
              <div class="w-full">
                <p class="!text-left text-xl !text-neutral-300 md:text-2xl">{location.country}, {location.city}</p>
                <p class="flex items-center gap-1 !text-left tracking-wider !text-neutral-300">
                  <PinIcon className="h-4 w-4 inline" />
                  {location.ip}
                </p>
              </div>
              <a class="flex flex-row gap-1 !text-neutral-300 max-sm:hidden" target="_blank" href={location.map}>
                Link <ExternalLinkIcon className="h-4 w-4" />
              </a>
            </div>
          {/each}
        </div>
      {:else if $currentStep === 2}
        <h3>Customize your identity</h3>
        <p class="lg:w-1/2">Customize the physical appearance of your identity to your liking.</p>
        <div class="flex w-full items-center justify-center gap-12 max-md:flex-col">
          <div class="flex flex-col items-center gap-4">
            <h3 class="w-96 text-center">{server.identity.name}, {server.identity.age}</h3>
            <img
              class="my-2 h-64 w-64 rounded-lg sm:h-96 sm:w-96"
              src={`data:image/png;base64,${server.identity.picture}`}
              alt="identity look" />
            <Tooltip
              tip="Regenerate the identity's profile picture based on the information you provided us. The bio will be taken into account">
              <LoadingButton onclick={() => handleEvent('identities')} index={2}>
                <UserIcon className="h-6 w-6 -mr-2" />Regenerate profile picture
              </LoadingButton>
            </Tooltip>
          </div>
          <div class="flex w-full flex-col gap-4 md:w-1/2 lg:w-1/3">
            <div class="flex items-end gap-4">
              <label for="name">Name</label>
              <ActionIcon
                title="regenerate a random name"
                icon={RepeatIcon}
                action={() => handleEvent('repeat-name')}
                size={'small'} />
            </div>
            <input bind:value={server.identity.name} type="text" placeholder="John Doe" name="name" />

            <label for="sex">Sex</label>
            <div class="flex flex-row gap-4">
              <div
                id="male"
                class="sex-box {server.identity.sex === 'male' && 'selected'}"
                onclick={() => handleEvent('sexes', 'male')}
                aria-hidden="true">
                <MaleIcon /> Male
              </div>
              <div
                id="female"
                class="sex-box {server.identity.sex === 'female' && 'selected'}"
                onclick={() => handleEvent('sexes', 'female')}
                aria-hidden="true">
                <FemaleIcon /> Female
              </div>
            </div>

            <label for="ethnicity">Ethnicity</label>
            <SelectMenu options={ethnicities} name="ethnicity" value={server?.identity?.ethnicity} />

            <label for="age">Age</label>
            <input type="number" name="age" placeholder="18-60" bind:value={server.identity.age} />

            <div class="flex items-end gap-4">
              <label for="bio">Bio</label>
              <ActionIcon title="regenerate a random bio" icon={RepeatIcon} action={() => handleEvent('repeat-bio')} size="small" />
            </div>
            <textarea placeholder="Short bio, will be used when generating a profile picture" value={server.identity.bio}></textarea>
          </div>
        </div>
      {:else if $currentStep === 3}
        <h3>Create your email address</h3>
        <p class="lg:w-1/2">Enter an email address to be associated with your identity. It can only contain letters and numbers.</p>
        <div class="flex items-center gap-3 max-sm:flex-col">
          <InputWithIcon icon={EmailIcon} type="email" fill={true} value={server.email} placeholder="Username" name="email" />
          <label class="!mt-0" for="email">@shadowself.io</label>
        </div>
        <small>
          Note: To access the inbox and send messages, you will only use our client. other clients (ex: thunderbird) will not work as
          we take care of security and credentials for you.
        </small>
      {:else if $currentStep === 4}
        <h3>Give yourself a phone number</h3>
        <p class="lg:w-1/2">Select from the available phone numbers we have for you to use with your identity.</p>
        <SelectMenu
          options={server.phone.map((phone) => ({value: phone.phone, label: phone.formatted}))}
          icon={PhoneIcon}
          name="phone" />
        <small>
          Important: These phone numbers are local and support both SMS and voice calls. However, if left inactive, they may be
          reclaimed by the provider. To avoid this, make sure to keep them in use.
        </small>
      {:else if $currentStep === 5}
        <h3>Make your virtual card</h3>
        <p class="lg:w-1/2">Forge your own virtual card that you can use to make payments.</p>
        <p>Currently unavailable</p>
        <!-- <CreditCardIcon className={'!h-6 !w-6 fill-neutral-300'} fill={true} /> -->
        <!-- <InputWithIcon icon={LimitIcon} type="number" value={'100'} placeholder="100$" name="limit" /> -->
      {:else if $currentStep === 6}
        <h3>Install our browser extension</h3>
        <p class="lg:w-1/2">
          With our browser extension, you can access our VPN services, change user agents, and view your identity information.
        </p>
        <img loading="lazy" class="my-4 h-64 rounded-xl border border-neutral-700" src={screenshot} alt="shadowself extension" />
        <ExtensionLinks extension={'shadowself'} />
      {:else if $currentStep === 7}
        <h3>Sync the extension with your account</h3>
        <p class="lg:w-1/2">Securely authenticate and link your identity to the extension by clicking the button below.</p>
        <button disabled class="flex items-center justify-center gap-2 text-wrap sm:w-1/3" onclick={() => handleEvent('sync')}>
          <ExtensionIcon />Sync with extension
        </button>
      {:else if $currentStep === 8}
        <div class="flex items-center justify-center gap-6 max-xl:flex-col sm:gap-16 sm:p-8">
          <h3 class="xl:hidden">Install ublock origin (optional)</h3>
          <div class="flex flex-col items-center gap-4">
            <img class="h-52 w-52" src={ublock} alt="ublock origin" />
            <h3 class="mb-8 font-semibold">uBlock Origin</h3>
            <ExtensionLinks extension={'ublock'} />
          </div>
          <div class="flex w-[45rem] max-w-[80vw] flex-col gap-4">
            <h3 class="mb-8 pl-4 !text-left max-xl:hidden">Install ublock origin (optional)</h3>
            <p class="short !text-neutral-300">
              uBlock Origin is a powerful, open-source ad blocker that boosts online privacy by blocking ads, trackers, and malicious
              scripts. Lightweight and efficient, it ensures a cleaner, more secure web experience. Combined with our tools, it keeps
              your privacy protected.
            </p>
            <p class="short">
              Note: The recent Manifest V3 update on Chromium browsers limits uBlock Origin’s functionality. Switching to Firefox
              ensures full privacy control and extension support.
            </p>
          </div>
        </div>
      {:else if $currentStep === 9}
        <div class="flex items-center justify-center gap-6 max-xl:flex-col sm:gap-16 sm:p-8">
          <h3 class="xl:hidden">Install ublock origin (optional)</h3>
          <div class="flex flex-col items-center gap-4">
            <img class="h-52 w-52" src={canvas} alt="canvas blocker" />
            <h3 class="mb-8 font-semibold">Canvas Blocker</h3>
            <ExtensionLinks extension={'canvas'} />
          </div>
          <div class="flex w-[45rem] max-w-[80vw] flex-col gap-4">
            <h3 class="mb-8 pl-4 !text-left max-xl:hidden">Install canvas blocker (optional)</h3>
            <p class="text-pretty !text-left !text-neutral-300">
              Canvas Blocker protects against browser fingerprinting by blocking tracking techniques based on unique device
              characteristics. It enhances privacy by preventing websites from creating identifiable profiles. Paired with Shadowself,
              it ensures your identity remains untraceable.
            </p>
            <p class="text-pretty !text-left">
              Note: Canvas Blocker is only available for Firefox and its forks, offering fingerprinting protection exclusively on these
              browsers, not on Chrome or other Chromium-based browsers.
            </p>
          </div>
        </div>
      {:else if $currentStep === 10}
        <HappyIcon className="w-40 h-40" />
        <h3>Your identity is now ready!</h3>
        <p class="lg:w-1/2">
          Thank you for completing the entire process. You can now use your identity however you wish. You still have the option to
          redo the process now, but keep in mind that you won’t be able to make some changes later.
        </p>
        <div class="flex w-full items-center justify-center gap-16">
          <button class="alt px-4 sm:px-8" onclick={() => window.location.reload()}>Redo</button>
          <button class="px-8 sm:px-16" onclick={() => ($modalIndex = 1)}>Finish →</button>
        </div>
        <Modal>
          <div class="flex flex-col gap-4">
            <h1 class="ml-2 text-5xl font-semibold text-neutral-300">Are you sure?</h1>
            <p class="mb-2 !text-left">
              You will not be able to change some important configurations later on.
              <br class="max-md:hidden" /> Are you sure you want to proceed?
            </p>
            <div class="flex justify-end gap-4">
              <button class="alt text-primary-700 hover:text-primary-800" onclick={() => ($modalIndex = 0)}>Cancel</button>
              <LoadingButton onclick={respondServer}>Confirm</LoadingButton>
            </div>
          </div>
        </Modal>
      {/if}
    </FlowStep>
  {:catch}
    <div class="flex flex-col items-center gap-8">
      <InfoIcon fill={true} className="h-28 w-28 text-neutral-300" />
      <h3>Something Went Wrong.</h3>
      <p class="lg:w-3/5">
        There was an issue with your request. This could be due to a network error or a bad request on your part. Please try reloading
        the page and give it another go.
      </p>
      <button class="w-1/3" onclick={() => window.location.reload()}>Retry</button>
    </div>
  {/await}
</div>

<style lang="postcss">
  #create-identity {
    @apply mx-auto mb-[4rem] mt-[10rem] flex min-h-[60vh] w-5/6 items-center justify-center;
  }

  h3 {
    @apply text-center text-4xl text-neutral-300;
  }

  p {
    @apply text-balance text-center text-neutral-400 md:px-4;
  }

  label {
    @apply mt-2 text-neutral-300;
  }

  small {
    @apply !text-pretty text-center text-[1rem] text-neutral-400 lg:w-1/2;
  }

  .short {
    @apply text-pretty !text-left text-lg leading-[1.65] md:!text-xl md:!leading-[1.85];
  }

  textarea {
    @apply w-full resize-none;
  }

  .locations-box {
    @apply flex min-w-[35vw] flex-row items-center justify-between gap-8 px-6 py-3;
    @apply border-t border-neutral-500 first:border-none hover:bg-neutral-300/10;
  }

  .sex-box {
    @apply flex h-12 w-1/2 items-center justify-center gap-px font-semibold transition-all duration-300 ease-in-out;
    @apply cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800/30 p-3 hover:text-neutral-400;
  }

  .sex-box.selected {
    @apply bg-primary-600/65 hover:text-neutral-300;
  }
</style>
