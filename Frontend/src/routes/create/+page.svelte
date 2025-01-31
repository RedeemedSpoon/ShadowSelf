<script lang="ts">
  import type {PageData} from './$types';
  import {page} from '$app/state';
  import {onMount} from 'svelte';
  import {notify} from '$lib';

  let ws: WebSocket | undefined = $state();
  let {data}: {data: PageData} = $props();

  onMount(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ws = new WebSocket(`wss://${page.url.hostname}/ws?id=${data.id}`);

    ws.onopen = () => {
      ws?.send(JSON.stringify({type: 'create'}));
    };
    ws.onmessage = (event) => {
      notify(event.data, 'info');
    };
  });
</script>

<svelte:head>
  <title>ShadowSelf - Create New Identity</title>
  <meta name="description" content="Create and customize your identity here quickly and efficiently to get started." />
</svelte:head>

<div id="create-identity">
  {#key ws}
    <div class="flex items-center justify-center">
      {#if ws}
        <h1>Connected</h1>
      {:else}
        <h1>Loading</h1>
      {/if}
    </div>
  {/key}
</div>

<style lang="postcss">
  #create-identity {
    @apply mx-auto mb-[4rem] mt-[10rem] flex h-fit w-5/6 flex-col gap-12;
  }
</style>
