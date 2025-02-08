<script lang="ts">
  import {InfoIcon, ExternalLinkIcon} from '$icon';
  import {ContinuousProcess} from '$component';
  import type {CreationProcess} from '$type';
  import type {PageData} from './$types';
  import {goto} from '$app/navigation';
  import {currentStep} from '$store';
  import {page} from '$app/state';
  import {notify} from '$lib';

  let {data}: {data: PageData} = $props();

  let server = $state() as CreationProcess;
  let loaderInterval: unknown;
  let ws: WebSocket | null;

  async function init() {
    if (data.cookie) initWebsocket();
    const loader = document.querySelector('#loader-process') as HTMLParagraphElement;

    loaderInterval = setInterval(() => {
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

    ws.onopen = () => reply('start');
    ws.onclose = (ws) => ws.code === 1014 && notify(ws.reason, 'alert');

    ws.onmessage = async (event) => {
      const response = JSON.parse(event.data) as CreationProcess;
      if (response.error) return notify(response.error, 'alert');
      $currentStep = response.locations ? 1 : $currentStep + 1;
      server = response;
    };
  }

  function reply(kind: string, body?: {[key: string]: string}) {
    ws?.send(JSON.stringify({kind, ...body}));
  }

  function respondServer() {
    switch ($currentStep) {
      case 1:
        reply('locations');
        break;

      case 8:
        $currentStep = 9;
        break;

      case 9:
        $currentStep = 10;
        break;

      case 10:
        clearInterval(loaderInterval as number);
        goto('/dashboard');
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
    <ContinuousProcess finalStep={10} handleClick={respondServer}>
      {#if $currentStep === 1}
        <h3>Choose your location</h3>
        <div class="flex cursor-pointer flex-col">
          {#each server.locations as location}
            <div class="px-6 py-3 odd:bg-neutral-800 hover:opacity-70">
              <p class="text-2xl">{location.country}, {location.city}</p>
              <p>{location.ip}</p>
              <a class="flex flex-row gap-1 !text-neutral-500" target="_blank" href={location.map}>
                Link <ExternalLinkIcon className="h-4 w-4" />
              </a>
            </div>
          {/each}
        </div>
      {:else if $currentStep === 2}
        <h3>Customize your identity</h3>
      {:else if $currentStep === 3}
        <h3>Create your phone number</h3>
      {:else if $currentStep === 4}
        <h3>Give yourself an email address</h3>
      {:else if $currentStep === 5}
        <h3>Make your virtual card</h3>
      {:else if $currentStep === 6}
        <h3>Install our browser extension</h3>
      {:else if $currentStep === 7}
        <h3>Sync the extension with your account</h3>
      {:else if $currentStep === 8}
        <h3>Install ublock origin (optional)</h3>
      {:else if $currentStep === 9}
        <h3>Install canvas blocker (optional)</h3>
      {:else if $currentStep === 10}
        <h3>Finish up!</h3>
      {/if}
    </ContinuousProcess>
  {:catch}
    <div class="flex flex-col items-center gap-8">
      <InfoIcon fill={true} className="h-28 w-28 text-neutral-300" />
      <h3>Something Went Wrong.</h3>
      <p class="px-2 text-center text-neutral-400 lg:w-3/5">
        There was an issue with your request. This could be due to a network error or a bad request on your part. Please try reloading
        the page and give it another go.
      </p>
      <button class="w-1/3" onclick={() => window.location.reload()}>Retry</button>
    </div>
  {/await}
</div>

<style lang="postcss">
  #create-identity {
    @apply mx-auto mb-[4rem] mt-[10rem] flex min-h-[70vh] w-5/6 items-center justify-center;
  }

  h3 {
    @apply text-4xl text-neutral-300;
  }
</style>
