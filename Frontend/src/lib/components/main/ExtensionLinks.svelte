<script lang="ts">
  import {website, github} from '$image';
  import {ChevronIcon} from '$icon';
  import {toTitleCase} from '$lib';

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

  const extensionInfo = {
    shadowself: {
      firefox: '',
      chrome: '',
      edge: '',
      opera: '',
    },
    ublock: {
      website: 'https://ublockorigin.com',
      github: 'https://github.com/gorhill/uBlock',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/ublock-origin',
      chrome: 'https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm',
      edge: 'https://microsoftedge.microsoft.com/addons/detail/ublock-origin/odfafepnkmbhccpbejgmiehpchacaeak',
      opera: 'https://addons.opera.com/en/extensions/details/ublock',
    },
    canvas: {
      website: 'https://canvasblocker.kkapsner.de',
      github: 'https://github.com/kkapsner/CanvasBlocker',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/canvasblocker',
    },
  };
</script>

<div>
  <div class="group flex w-[350px] items-center justify-center gap-0">
    <a href={extensionInfo[extension]['firefox']} target="_blank" rel="noreferrer">
      <button class="group-hover:!bg-pos-100 !h-16 {extension !== 'canvas' && '!rounded-r-none !pr-8'} {expand && '!rounded-b-none'}">
        <p>Download for {@html browserIcons['firefox']} Firefox</p>
      </button>
    </a>
    {#if extension !== 'canvas'}
      <div class="h-16 w-[2px] bg-neutral-300/90"></div>
      <button onclick={() => (expand = !expand)} class="group-hover:!bg-pos-100 expand {expand && '!rounded-b-none'}">
        <span class:rotate-180={expand}><ChevronIcon className="rotate-90" /></span>
      </button>
    {/if}
  </div>
  {#if expand && extension !== 'canvas'}
    <div class="absolute">
      {#each ['chrome', 'edge', 'opera'] as otherBrowser, i}
        <a href={extensionInfo[extension][otherBrowser as 'firefox']} target="_blank" rel="noreferrer">
          <button class="other-link !rounded-none {i === 2 && '!rounded-b-xl'}">
            <p>Download for {@html browserIcons[otherBrowser as keyof typeof browserIcons]} {toTitleCase(otherBrowser)}</p>
          </button>
        </a>
      {/each}
    </div>
  {/if}
  {#if extension !== 'shadowself'}
    <div id="sublinks" class="flex justify-evenly p-4">
      <a href={extensionInfo[extension].website} target="_blank">
        <img src={website} class="h-7 w-7" alt="Website" />Website
      </a>
      <a href={extensionInfo[extension].github} target="_blank">
        <img src={github} alt="Github" class="h-6 w-6" />Github
      </a>
    </div>
  {/if}
</div>

<style lang="postcss">
  button {
    @apply flex cursor-pointer items-center gap-2 rounded-xl px-6 shadow-none;
  }

  button.other-link {
    @apply !h-16 w-[350px] border-t-[2px] border-neutral-300/85 text-neutral-400 hover:text-neutral-300;
    @apply from-primary-700 to-primary-700 hover:from-primary-600 hover:to-primary-600;
  }

  .expand {
    @apply !h-16 !rounded-l-none !px-4;
  }

  span {
    @apply transition-all duration-500 ease-in-out;
  }

  p {
    @apply flex items-center gap-1 font-semibold;
  }

  #sublinks a {
    @apply flex items-center gap-1 text-neutral-400 hover:text-neutral-400 hover:opacity-80;
  }
</style>
