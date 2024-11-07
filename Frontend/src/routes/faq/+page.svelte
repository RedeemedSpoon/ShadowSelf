<script lang="ts">
  import type {PageData} from './$types';

  let {data}: {data: PageData} = $props();

  function handleClick(question: PageData['faqs'][number], index: number) {
    console.log(question, index);
  }
</script>

<svelte:head>
  <title>ShadowSelf - FAQ</title>
  <meta name="description" content="Find answers to common questions about ShadowSelf and our services." />
</svelte:head>

<menu>
  <h1>Frequently Asked Questions</h1>
  <section>
    {#each data.faqs as question, index (index)}
      <div onclick={() => handleClick(question, index)} aria-hidden="true">
        <div class="relative">
          <h3>{question.question}</h3>
          <h4>×</h4>
        </div>
        <p class="mb-10 mt-4 text-neutral-400">{question.answer}</p>
      </div>
    {/each}
  </section>
</menu>

<style lang="postcss">
  menu {
    @apply mx-auto my-[10rem] flex h-fit w-11/12 flex-col gap-6 text-neutral-400 md:w-3/4 xl:w-1/2;
  }

  h1 {
    @apply mb-8 text-center text-4xl text-neutral-300;
  }

  h3 {
    @apply border-primary-700 cursor-pointer border-b-2 py-4 pl-4 text-3xl text-neutral-300;
  }

  h4 {
    @apply absolute right-4 top-3 cursor-pointer select-none text-3xl text-neutral-300;
  }
</style>
