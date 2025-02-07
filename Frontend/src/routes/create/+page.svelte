<script lang="ts">
  import type {PageData} from './$types';
  import {fly} from 'svelte/transition';
  import {page} from '$app/state';
  import {InfoIcon} from '$icon';
  import {notify} from '$lib';

  let {data}: {data: PageData} = $props();
  let steps = $state(1);

  async function init() {
    if (data.cookie) initWebsocket();
    const loader = document.querySelector('#loader-process') as HTMLParagraphElement;

    setInterval(() => {
      if (loader?.innerText.length === 3) loader!.innerText = '';
      else loader!.innerText += '.';
    }, 650);

    return new Promise((resolve, reject) => {
      setTimeout(() => (data.cookie ? resolve(true) : reject()), 1950);
    });
  }

  async function initWebsocket() {
    const ws = new WebSocket(`wss://${page.url.hostname}/ws-creation-process`);

    ws.onmessage = async (event) => {
      const response = JSON.parse(event.data);
      console.log(response);
    };

    ws.onclose = (ws) => {
      if (ws.code === 1014) notify(ws.reason, 'alert');
    };
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
    {#key steps}
      <section
        class="flex w-full flex-col justify-center gap-8"
        in:fly={{delay: 500, x: 35, opacity: 0, duration: 500}}
        out:fly={{x: -35, opacity: 0, duration: 500}}>
        <h3>Step {steps}</h3>
        <button onclick={() => steps++}>Continue As Guest</button>
      </section>
    {/key}
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
    @apply text-5xl text-neutral-300;
  }
</style>
