<script lang="ts">
  import {onMount, type Component} from 'svelte';
  import {selectionInputOpen} from '$store';
  import type {Option} from '$type';
  import {ChevronIcon} from '$icon';

  interface Props {
    options: Option[] | string[];
    icon?: Component;
    value?: string;
    name: string;
  }

  let {name, options, value, icon}: Props = $props();

  let givenOptions: Option[] = $state([]);
  let btn: HTMLButtonElement;
  let select: HTMLDivElement;
  let input: HTMLInputElement;

  if (typeof options[0] === 'string') {
    //@ts-expect-error option is string[]
    givenOptions = options.map((option) => {
      return {label: option, value: option.toString().toLowerCase()};
    });
  } else {
    givenOptions = options as Option[];
  }

  function handleBtnSelect(e: MouseEvent) {
    e.stopPropagation();
    if ($selectionInputOpen) btn.blur();
    $selectionInputOpen = !$selectionInputOpen;
  }

  function handleSltClick(e: MouseEvent) {
    e.stopPropagation();
    $selectionInputOpen = false;

    const target = e.target as HTMLLIElement;
    const span = btn.childNodes[1] as HTMLSpanElement;

    span.innerText = target.innerText;
    input.value = target.id;
    btn.blur();
  }

  onMount(() => {
    function handleClick(e: MouseEvent) {
      if (!select.contains(e.target as Node)) $selectionInputOpen = false;
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });
</script>

<input required bind:this={input} type="hidden" name={name.toLowerCase()} value={value || givenOptions[0].value} />
<div bind:this={select} id="select-input" class="relative min-w-[15vw]">
  <button type="button" bind:this={btn} onclick={handleBtnSelect}>
    <div class="flex items-center gap-2">
      {#if icon}
        {@const SvelteComponent = icon}
        <SvelteComponent className="w-7 h-7 !stroke-none !fill-neutral-300" } />
      {/if}
      <span>{givenOptions.find((option) => option.value === value)?.label || givenOptions[0].label}</span>
    </div>
    <ChevronIcon className="rotate-90" />
  </button>
  <ul onclick={handleSltClick} class:hidden={!$selectionInputOpen} aria-hidden={!$selectionInputOpen}>
    {#each givenOptions as option}
      <li id={option.value}>{option.label}</li>
    {/each}
  </ul>
</div>

<style lang="postcss">
  ul {
    @apply max-h-[275px] overflow-y-scroll;
  }

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
