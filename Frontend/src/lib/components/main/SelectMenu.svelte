<script lang="ts">
  import {CheveronImg} from '$components';
  import {selectionInputOpen} from '$store';
  import {onMount} from 'svelte';

  interface Props {
    name: string;
    options: {value: string; label: string}[];
  }

  let {name, options}: Props = $props();
  let btn: HTMLButtonElement;
  let select: HTMLDivElement;
  let input: HTMLInputElement;

  function handleBtnSelect(e: MouseEvent) {
    e.stopPropagation();
    if ($selectionInputOpen) btn.blur();
    $selectionInputOpen = !$selectionInputOpen;
  }

  function handleSltClick(e: MouseEvent) {
    e.stopPropagation();
    $selectionInputOpen = false;

    const target = e.target as HTMLLIElement;
    const span = btn.childNodes[0] as HTMLSpanElement;

    span.innerText = target.innerText;
    input.value = target.id;
    btn.blur();
  }

  onMount(() => {
    document.addEventListener('click', (e) => {
      if (!select.contains(e.target as Node)) {
        $selectionInputOpen = false;
      }
    });
  });
</script>

<label for={name.toLowerCase()}>{name}</label>
<input required bind:this={input} type="hidden" name={name.toLowerCase()} value={options[0].value} />

<div bind:this={select} id="select-input" class="relative">
  <button type="button" bind:this={btn} onclick={handleBtnSelect}>
    <span>{options[0].label}</span><CheveronImg className="rotate-90" />
  </button>
  <ul onclick={handleSltClick} class:hidden={!$selectionInputOpen} aria-hidden={!$selectionInputOpen}>
    {#each options as option}
      <li id={option.value}>{option.label}</li>
    {/each}
  </ul>
</div>

<style lang="postcss">
  li {
    @apply cursor-pointer select-none bg-[#131c2e] px-4 py-3 hover:bg-neutral-800;
    @apply text-lg first:rounded-t-xl last:rounded-b-xl;
  }

  #select-input button {
    @apply focus:ring-primary-600 flex w-full justify-between p-4 text-lg shadow-none focus:ring-2;
    @apply border border-neutral-700/50 bg-neutral-800/30 bg-none;
  }

  #select-input ul {
    @apply absolute mt-4 rounded-xl shadow-2xl shadow-gray-950/50 ring-1 ring-gray-700/50;
    @apply w-full transition-all duration-300 ease-in-out;
  }
</style>
