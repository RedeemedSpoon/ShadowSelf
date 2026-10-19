<script lang="ts">
  import type {HomepageServiceId} from '$type';

  let {service}: {service: Extract<HomepageServiceId, 'identity' | 'email' | 'phone'>} = $props();
</script>

<svg
  viewBox="0 0 32 32"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true">
  {#if service === 'identity'}
    <rect x="3" y="7" width="26" height="22" rx="4" fill="currentColor" fill-opacity=".08" />
    <path d="M12 7V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M14 5h4" />
    <circle cx="11" cy="16" r="3" />
    <path d="M6 24c0-6 10-6 10 0m4-10h5m-5 5h5m-5 5h3" />
  {:else if service === 'email'}
    <path d="M3 13 16 4l13 9v13a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V13Z" fill="currentColor" fill-opacity=".08" />
    <path d="M7 16V6h18v10" fill="#1b182a" />
    <path d="M12 10h8m-8 4h5M3 14l10 8a5 5 0 0 0 6 0l10-8M3 27l8-7m18 7-8-7" />
  {:else if service === 'phone'}
    <rect x="4" y="2" width="17" height="28" rx="4" fill="currentColor" fill-opacity=".08" />
    <path d="M10 5h5m-4 22h3" />
    <path d="M15 10h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-5l-5 4v-4h-2a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z" fill="#102337" />
    <path d="M17 14h8m-8 4h5" />
  {/if}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
