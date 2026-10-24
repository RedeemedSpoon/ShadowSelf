<script lang="ts">
  const id = $props.id();
</script>

<svg viewBox="0 0 300 180" fill="none" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">
  <defs>
    <linearGradient id={`${id}-metal`} x1="70" y1="20" x2="220" y2="165" gradientUnits="userSpaceOnUse">
      <stop stop-color="#333a56" />
      <stop offset="0.5" stop-color="#1b2238" />
      <stop offset="1" stop-color="#0b1120" />
    </linearGradient>
    <linearGradient id={`${id}-ink`} x1="90" y1="30" x2="210" y2="150" gradientUnits="userSpaceOnUse">
      <stop stop-color="var(--link-color)" />
      <stop offset="1" stop-color="var(--link-color-pressed)" />
    </linearGradient>
  </defs>
  <ellipse cx="150" cy="157" rx="86" ry="8" fill="#030712" opacity="0.5" />
  <path
    d="m110 51 40-25 44 29 26 48-37 37-61 4-42-42z M110 51l12 93 72-89-84-4 73 89-33-114-28 118 98-41-110-52"
    stroke="#475875"
    stroke-width="1.4" />
  <g fill="#8996b0">
    <circle cx="110" cy="51" r="3" />
    <circle cx="194" cy="55" r="3" />
    <circle cx="183" cy="140" r="3" />
    <circle cx="80" cy="102" r="3" />
  </g>
  <g fill={`url(#${id}-ink)`}>
    <circle cx="150" cy="26" r="5" />
    <circle cx="220" cy="103" r="3.5" />
    <circle cx="122" cy="144" r="3.5" />
    <path d="m224 47 4 9 9 4-9 4-4 9-4-9-9-4 9-4z" />
    <path d="m63 48 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
    <path d="m238 126 2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" />
  </g>
  <g fill="#8996b0">
    <path d="m49 92 2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" />
    <path d="m91 126 2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" />
  </g>
  <path d="m191 18 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#8996b0" />
  <circle cx="72" cy="37" r="1.5" fill="#66738e" />
  <circle cx="218" cy="143" r="1.5" fill="#66738e" />
  <circle cx="150" cy="85" r="27" fill={`url(#${id}-metal)`} stroke="var(--link-color)" stroke-width="1.4" />
  <circle cx="150" cy="76" r="7" fill="#8b98b2" />
  <path d="M136 99c0-18 28-18 28 0" fill="#8b98b2" />
</svg>

<style>
  svg {
    display: block;
    width: min(100%, 300px);
    height: 180px;
    margin: -8px auto 22px;
  }
</style>
