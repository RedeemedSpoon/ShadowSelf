<script lang="ts">
  import ChevronIcon from '$icon/navigation/Chevron.svelte';
  import generic from '$image/brands/generic.svg';
  import github from '$image/brands/github.svg';
  import {toTitleCase} from '$utils/formating';
  import {EXTENSIONS_INFO} from '$constant';

  let {extension}: {extension: 'shadowself' | 'ublock' | 'canvas'} = $props();
  let expand = $state(false);

  const browserIcons = {
    chrome:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="small-icon w-6 h-6 inline fill-none stroke-current"> <path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 9h8.4" /><path d="M14.598 13.5l-4.2 7.275" /><path d="M9.402 13.5l-4.2 -7.275" /></svg>',
    firefox:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 small-icon inline fill-none stroke-current"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4.028 7.82a9 9 0 1 0 12.823 -3.4c-1.636 -1.02 -3.064 -1.02 -4.851 -1.02h-1.647" /><path d="M4.914 9.485c-1.756 -1.569 -.805 -5.38 .109 -6.17c.086 .896 .585 1.208 1.111 1.685c.88 -.275 1.313 -.282 1.867 0c.82 -.91 1.694 -2.354 2.628 -2.093c-1.082 1.741 -.07 3.733 1.371 4.173c-.17 .975 -1.484 1.913 -2.76 2.686c-1.296 .938 -.722 1.85 0 2.234c.949 .506 3.611 -1 4.545 .354c-1.698 .102 -1.536 3.107 -3.983 2.727c2.523 .957 4.345 .462 5.458 -.34c1.965 -1.52 2.879 -3.542 2.879 -5.557c-.014 -1.398 .194 -2.695 -1.26 -4.75" /></svg>',
    edge: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" class="small-icon w-6 h-6 inline fill-none stroke-current"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20.978 11.372a9 9 0 1 0 -1.593 5.773" /><path d="M20.978 11.372c.21 2.993 -5.034 2.413 -6.913 1.486c1.392 -1.6 .402 -4.038 -2.274 -3.851c-1.745 .122 -2.927 1.157 -2.784 3.202c.28 3.99 4.444 6.205 10.36 4.79" /><path d="M3.022 12.628c-.283 -4.043 8.717 -7.228 11.248 -2.688" /><path d="M12.628 20.978c-2.993 .21 -5.162 -4.725 -3.567 -9.748"/></svg>',
    opera:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="small-icon w-6 h-6 inline fill-none stroke-current"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 12m-3 0a3 5 0 1 0 6 0a3 5 0 1 0 -6 0" /></svg>',
  };
</script>

<!-- eslint-disable -->
<div class="z-10 max-sm:scale-90">
  <div class="group flex w-87.5 items-center justify-center gap-0">
    <a href={EXTENSIONS_INFO[extension]['firefox']} target="_blank" rel="noreferrer">
      <button
        class="group-hover:from-primary-800! group-hover:to-primary-800! h-16! {extension !== 'canvas' &&
          'rounded-r-none! pr-8!'} {expand && 'rounded-b-none!'}">
        <p>Download for {@html browserIcons['firefox']} Firefox</p>
      </button>
    </a>
    {#if extension !== 'canvas'}
      <div class="z-10 h-8 w-0.5 bg-neutral-300/90"></div>
      <button
        onclick={() => (expand = !expand)}
        class="group-hover:from-primary-800! group-hover:to-primary-800! expand -ml-1! {expand && 'rounded-b-none!'}">
        <span class:rotate-180={expand}><ChevronIcon className="rotate-90" /></span>
      </button>
    {/if}
  </div>

  {#if expand && extension !== 'canvas'}
    <div class="absolute">
      {#each ['chrome', 'edge', 'opera'] as otherBrowser, i (i)}
        <a href={EXTENSIONS_INFO[extension][otherBrowser as 'firefox']} target="_blank" rel="noreferrer">
          <button class="other-link rounded-none! {i === 2 && 'rounded-b-xl!'}">
            <p>Download for {@html browserIcons[otherBrowser as 'firefox']} {toTitleCase(otherBrowser)}</p>
          </button>
        </a>
      {/each}
    </div>
  {/if}

  {#if extension === 'ublock' || extension === 'canvas'}
    <div id="sublinks" class="flex justify-evenly p-4">
      <a href={EXTENSIONS_INFO[extension].website} target="_blank">
        <img src={generic} class="h-7 w-7" alt="Website" />Website
      </a>
      <a href={EXTENSIONS_INFO[extension].github} target="_blank">
        <img src={github} alt="Github" class="h-6 w-6" />Github
      </a>
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference "$style";

  button {
    @apply flex cursor-pointer items-center gap-2 rounded-xl px-6 shadow-none duration-300;
    @apply from-primary-700 to-primary-700 hover:to-primary-800 hover:from-primary-800;
  }

  button.other-link {
    @apply ml-0.5 h-16! w-86.5 border-t-2 border-neutral-300/85 text-neutral-300;
  }

  .expand {
    @apply h-16! rounded-l-none! px-4!;
  }

  p {
    @apply flex items-center gap-1 font-semibold text-nowrap;
  }

  span {
    @apply transition-all duration-300 ease-in-out;
  }

  #sublinks a {
    @apply flex items-center gap-1 text-neutral-400 hover:text-neutral-400 hover:opacity-80;
  }
</style>
