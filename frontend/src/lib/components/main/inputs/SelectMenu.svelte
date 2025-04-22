<script lang="ts">
  import {onMount, type Component} from 'svelte';
  import type {Option} from '$type';
  import {ChevronIcon} from '$icon';

  interface Props {
    options: Option[] | string[];
    fullIcons?: {[key: string]: Component};
    callback?: (value: string) => void;
    size?: 'small' | 'big';
    icon?: Component;
    value?: string;
    name: string;
  }

  let {name, options, value, icon, fullIcons, callback, size = 'big'}: Props = $props();

  let selectionInputOpen = $state(false);
  let givenOptions: Option[] = $state([]);
  let input = $state() as HTMLInputElement;
  let key = $state(false);

  let btn: HTMLButtonElement;
  let select: HTMLDivElement;

  if (typeof options[0] === 'string') {
    givenOptions = options.map((option) => {
      return {label: option, value: option.toString().toLowerCase()};
    }) as Option[];
  } else {
    givenOptions = options as Option[];
  }

  function handleBtnSelect(e: MouseEvent) {
    e.stopPropagation();
    if (selectionInputOpen) btn.blur();
    selectionInputOpen = !selectionInputOpen;
  }

  function handleSltClick(e: MouseEvent) {
    e.stopPropagation();
    selectionInputOpen = false;

    const target = e.target as HTMLLIElement;
    const span = btn.querySelector('span') as HTMLSpanElement;

    key = !key;
    input.value = target.id;
    span.innerText = target.innerText;

    if (callback) callback(input.value);
    btn.blur();
  }

  onMount(() => {
    function handleClick(e: MouseEvent) {
      if (!select.contains(e.target as Node)) selectionInputOpen = false;
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });
</script>

<input
  type="hidden"
  bind:this={input}
  name={name.toLowerCase()}
  onclick={() => (btn.querySelector('span')!.innerText = input.value)}
  value={value || givenOptions[0].value} />

<div bind:this={select} id="select-input" class="relative z-20 min-w-[9.5rem] {size === 'big' && 'min-w-[15vw]!'}">
  <button type="button" bind:this={btn} onclick={handleBtnSelect} class:little={size === 'small'}>
    <div class="flex items-center gap-2">
      {#key key}
        {#if icon || fullIcons}
          {@const Icon = icon ? icon : fullIcons![input?.value.toLowerCase() || givenOptions[0].value]}
          <Icon className="{size === 'small' ? 'w-5 h-5' : 'w-7 h-7'} stroke-none! fill-neutral-300!" } />
        {/if}
      {/key}
      <span>{givenOptions.find((option) => option.value === value)?.label || givenOptions[0].label}</span>
    </div>
    <ChevronIcon className="{size === 'small' && 'w-5 h-5 mt-1'} rotate-90!" />
  </button>
  <ul onclick={handleSltClick} class:hidden={!selectionInputOpen} aria-hidden={!selectionInputOpen}>
    {#each givenOptions as option}
      {#if fullIcons}
        {@const Icon = fullIcons[option.value]}
        <li class="flex items-center gap-2" id={option.value}>
          <Icon className="{size === 'small' ? 'w-5 h-5' : 'w-7 h-7'} stroke-none! fill-neutral-300!" />
          {option.label}
        </li>
      {:else}
        <li id={option.value}>{option.label}</li>
      {/if}
    {/each}
  </ul>
</div>

<style lang="postcss">
  @reference "tailwindcss";

  ul {
    @apply max-h-[275px] overflow-y-scroll;
  }

  button.little {
    @apply !px-2 !py-1 !text-lg;
  }

  li {
    @apply cursor-pointer select-none bg-[#131c2e] px-4 py-3 text-neutral-300 hover:bg-neutral-800;
    @apply text-lg first:rounded-t-xl last:rounded-b-xl;
  }

  #select-input button {
    @apply focus:ring-primary-600 flex w-full justify-between p-4 text-lg shadow-none focus:ring-2;
    @apply border border-neutral-700/50 bg-neutral-800/30 bg-none;
  }

  #select-input ul {
    @apply absolute mt-4 rounded-xl shadow-2xl shadow-gray-950/50 ring-1 ring-gray-700/50;
    @apply !mx-0 w-full transition-all duration-300 ease-in-out;
  }
</style>
