<script lang="ts">
  import type {PageData} from './$types';

  let {data}: {data: PageData} = $props();

  let list: HTMLElement;
  const sections = data.settings.map((item) => {
    return {
      title: item,
      id: item.toLowerCase().split(' ').join('-'),
    };
  });

  function handleClick(index: number) {
    const array = Array.from(list.children);
    array.forEach((item, i) => {
      if (i === index) {
        item.classList.add('!bg-neutral-300/10', 'border-l-4', '!pl-[4.5rem]');
      } else {
        item.classList.remove('!bg-neutral-300/10', 'border-l-4', '!pl-[4.5rem]');
      }
    });
  }
</script>

<svelte:head>
  <title>ShadowSelf - Settings</title>
  <meta name="description" content="Change your account settings here and keep yourself secure" />
</svelte:head>

<div id="settings">
  <ul bind:this={list} class="flex flex-col bg-neutral-800 pt-24 max-lg:hidden">
    {#each sections as section, i}
      <a onclick={() => handleClick(i)} href="#{section.id}" style="top: {(i + 2.5) * 4}rem"><li>{section.title}</li></a>
    {/each}
  </ul>
  <section class="flex h-full w-full flex-col gap-8 px-24 pt-20">
    <h1 class="basic-style text-5xl font-bold">Settings</h1>
    <p class="-mt-6">Change your account settings here and keep yourself secure</p>
    <h2 id={sections[0].id}>{sections[0].title}</h2>
    <hr />
    <h2 id={sections[1].id}>{sections[1].title}</h2>
    <hr />
    <h2 id={sections[2].id}>{sections[2].title}</h2>
    <hr />
    <h2 id={sections[3].id}>{sections[3].title}</h2>
    <hr />
    <h2 id={sections[4].id}>{sections[4].title}</h2>
    <hr />
  </section>
</div>

<style lang="postcss">
  #settings {
    @apply grid h-full min-h-screen w-full grid-cols-[1fr_3fr] pt-[5rem] text-neutral-400;
  }

  h2 {
    @apply scroll-m-[12rem] text-3xl text-neutral-300;
  }

  a {
    @apply sticky py-[0.75rem] pl-16 text-neutral-300 transition-all duration-200 ease-in-out;
    @apply border-neutral-300 hover:bg-neutral-300/5 hover:text-neutral-300;
  }
</style>
