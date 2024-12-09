<script lang="ts">
  import type {PageData} from './$types';

  let {data}: {data: PageData} = $props();
</script>

<svelte:head>
  <title>ShadowSelf - Settings</title>
  <meta name="description" content="Change your account settings here and more to keep your account secure" />
</svelte:head>

<ul class="mx-auto my-[10rem] flex h-fit w-11/12 flex-col gap-6 md:w-3/4 xl:w-1/2">
  {#each data.settings as setting}
    <li>{setting}</li>
  {/each}
</ul>
