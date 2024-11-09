<script lang="ts">
  import Cheveron from '$components/icons/Cheveron.svelte';
  import type {PageData} from './$types';

  let {data}: {data: PageData} = $props();

  function handleClick(index: number) {
    const elements = document.querySelectorAll('.question');

    elements.forEach((element) => {
      if (element !== elements[index]) {
        element.children[0].children[1].classList.add('rotate-180');
        element.children[1].setAttribute('style', 'max-height: 0px');
      }
    });

    const icon = elements[index].children[0].children[1] as HTMLDivElement;
    const answer = elements[index].children[1] as HTMLParagraphElement;

    if (answer.style.maxHeight === answer.scrollHeight + 'px') {
      answer.style.marginTop = '0px';
      answer.style.maxHeight = '0px';
      icon.classList.add('rotate-180');
    } else {
      answer.style.marginTop = '20px';
      answer.style.maxHeight = answer.scrollHeight + 'px';
      icon.classList.remove('rotate-180');
    }
  }
</script>

<svelte:head>
  <title>ShadowSelf - FAQ</title>
  <meta name="description" content="Find answers to common questions about ShadowSelf and our services." />
</svelte:head>

<div id="faq">
  <h1>Frequently Asked Questions</h1>
  <menu>
    {#each data.faqs as question, index (index)}
      <div class="question">
        <div onclick={() => handleClick(index)} aria-hidden="true">
          <h3>{question.question}</h3>
          <h4 class="rotate-180"><Cheveron className="rotate-[-90deg]" /></h4>
        </div>
        <p>{question.answer}</p>
      </div>
    {/each}
  </menu>
</div>

<style lang="postcss">
  #faq {
    @apply mx-auto my-[10rem] flex h-fit w-11/12 flex-col gap-6 text-neutral-400 md:w-3/4 xl:w-1/2;
  }

  .question div {
    @apply relative transition-colors duration-300 ease-in-out hover:bg-neutral-300/10;
  }

  .question:nth-child(5),
  .question:nth-child(13),
  .question:nth-child(18) {
    @apply mb-[10vh];
  }

  h1 {
    @apply my-8 text-center text-5xl text-neutral-300;
  }

  h3 {
    @apply border-primary-700 cursor-pointer border-b-2 py-6 pl-4 pr-12 text-[1.65rem] text-neutral-300;
  }

  h4 {
    @apply absolute right-4 top-7 cursor-pointer select-none;
    @apply text-3xl text-neutral-300 transition-all duration-300 ease-in-out;
  }

  p {
    @apply max-h-0 px-2 text-neutral-400 transition-all duration-300 ease-in-out;
  }
</style>
