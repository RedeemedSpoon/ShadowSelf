<script lang="ts">
  import {page} from '$app/state';
  import {onMount} from 'svelte';

  let ws: WebSocket | undefined = $state();

  onMount(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    ws = new WebSocket(`ws://${page.url.host}/websocket`);

    ws.onopen = () => {
      ws?.send('help');
    };

    ws.onmessage = (e) => {
      ws?.send(e.data);
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
