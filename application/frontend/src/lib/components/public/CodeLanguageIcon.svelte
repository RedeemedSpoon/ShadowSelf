<script lang="ts">
  let {language}: {language: 'curl' | 'javascript' | 'python'} = $props();
</script>

<svg viewBox="0 0 24 24" aria-hidden="true">
  {#if language === 'curl'}
    <rect x="2" y="3" width="20" height="18" rx="3" fill="currentColor" />
    <path
      d="m6 8 4 4-4 4m7 0h5"
      fill="none"
      stroke="#0a1020"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round" />
  {:else if language === 'javascript'}
    <rect x="2" y="2" width="20" height="20" rx="2" fill="currentColor" />
    <text x="6" y="18" fill="#0a1020" font-family="sans-serif" font-weight="700" font-size="12">JS</text>
  {:else}
    <path
      d="M12 2C7 2 7 4 7 4v3h5v1H5c-3 0-3 3-3 5s0 5 3 5h2v-3c0-3 2-4 4-4h4c2 0 3-1 3-3V5s0-3-6-3Z"
      fill="currentColor" />
    <path
      d="M12 2C7 2 7 4 7 4v3h5v1H5c-3 0-3 3-3 5s0 5 3 5h2v-3c0-3 2-4 4-4h4c2 0 3-1 3-3V5s0-3-6-3Z"
      transform="rotate(180 12 12)"
      fill="currentColor"
      opacity=".6" />
    <circle cx="10" cy="5" r="1" fill="#0a1020" /><circle cx="14" cy="19" r="1" fill="#0a1020" />
  {/if}
</svg>

<style>
  svg {
    display: block;
    width: 17px;
    height: 17px;
    flex-shrink: 0;
  }
</style>
