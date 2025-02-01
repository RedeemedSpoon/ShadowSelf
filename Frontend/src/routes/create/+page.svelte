<script lang="ts">
  import type {PageData} from './$types';
  import {enhance} from '$app/forms';
  import {page} from '$app/state';
  import {onMount} from 'svelte';
  import {notify} from '$lib';

  let cookie = $state();
  let ws: WebSocket | undefined = $state();

  let {data}: {data: PageData} = $props();

  onMount(async () => {
    await new Promise((resolve) => setTimeout(resolve, 750));
    ws = new WebSocket(`wss://${page.url.hostname}/ws-creation-process?id=${data.id}`);

    ws.onmessage = async (event) => {
      const response = JSON.parse(event.data);
      if (response?.cookie) {
        cookie = response.cookie;
        await new Promise((resolve) => setTimeout(resolve, 100));

        const button = document.querySelector('button[name="cookie"]') as HTMLButtonElement;
        button.click();
      }
    };

    ws.onclose = (ws) => ws.code === 1014 && notify(ws.reason, 'alert');
  });
</script>

<svelte:head>
  <title>ShadowSelf - Create New Identity</title>
  <meta name="description" content="Create and customize your identity here quickly and efficiently to get started." />
</svelte:head>

<div id="create-identity">
  {#key ws}
    <div class="flex items-center justify-center">
      {#if cookie}
        <h1>You are successfully connected</h1>
      {:else}
        <h1>Still loading...</h1>
      {/if}
    </div>
  {/key}
</div>

<form method="POST" use:enhance>
  <button hidden type="submit" name="cookie" formaction="?/cookie">Submit</button>
  <input type="hidden" name="cookie-value" bind:value={cookie} />
</form>

<style lang="postcss">
  #create-identity {
    @apply mx-auto mb-[4rem] mt-[10rem] flex h-fit w-5/6 flex-col gap-12;
  }
</style>
