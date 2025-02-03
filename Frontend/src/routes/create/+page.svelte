<script lang="ts">
  import type {PageData} from './$types';
  import {page} from '$app/state';
  import {notify} from '$lib';

  let {data}: {data: PageData} = $props();

  async function init() {
    if (data.cookie) initWebsocket();
    const loader = document.querySelector('#loader-process') as HTMLParagraphElement;

    setInterval(() => {
      if (loader?.innerText.length === 3) loader!.innerText = '';
      else loader!.innerText += '.';
    }, 650);

    return new Promise((resolve, reject) => {
      setTimeout(() => (data.cookie ? resolve(true) : reject()), 1000);
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
    <div class="flex flex-row">
      <h3>Loading</h3>
      <h3 id="loader-process">.</h3>
    </div>
  {:then}
    <h3>You are successfully connected</h3>
  {:catch}
    <h3>You are NOT successfully connected</h3>
  {/await}
</div>

<style lang="postcss">
  #create-identity {
    @apply mx-auto mb-[4rem] mt-[10rem] flex h-fit min-h-[70vh] w-5/6 flex-col items-center justify-center gap-12;
  }

  h3 {
    @apply text-5xl text-neutral-300;
  }
</style>
