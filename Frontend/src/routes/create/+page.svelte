<script lang="ts">
  import {page} from '$app/state';
  import {onMount} from 'svelte';

  let ws: WebSocket | undefined = $state();

  // onMount(() => {
  //   const host = page.url.host;
  //   ws = new WebSocket(`wss://${host}/websocket`);
  //   ws.onopen = () => {
  //     console.log('connected');
  //   }
  // });
</script>

<svelte:head>
  <title>ShadowSelf - Create New Identity</title>
  <meta name="description" content="Create and customize your identity here quickly and efficiently to get started." />
</svelte:head>

<div id="create-identity">
  {#key ws}
    <div>
      {#if ws}
        <p>test</p>
      {:else}
        <p>loading</p>
      {/if}
    </div>
  {/key}
</div>

<style lang="postcss">
  #create-identity {
    @apply mx-auto mb-[4rem] mt-[10rem] flex h-fit w-5/6 flex-col gap-12;
  }
</style>
