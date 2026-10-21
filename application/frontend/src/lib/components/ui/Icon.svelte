<script lang="ts">
  let {name, size = 20, class: className = ''}: {name: string; size?: number; class?: string} = $props();
  const paths: Record<string, string> = {
    identities:
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
    user: 'M20 21v-2a7 7 0 0 0-14 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2 M22 6l-10 7L2 6',
    phone:
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.58 2.8.7A2 2 0 0 1 22 16.92z',
    wallet: 'M20 8V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H4 M22 12h-6v5h6 M18 14.5h.01',
    lock: 'M5 11h14v11H5z M8 11V7a4 4 0 0 1 8 0v4 M12 15v3',
    settings:
      'M19.39 8.94 L21.81 10.05 L21.81 13.95 L19.39 15.06 L19.39 15.06 L20.31 17.56 L17.56 20.31 L15.06 19.39 L15.06 19.39 L13.95 21.81 L10.05 21.81 L8.94 19.39 L8.94 19.39 L6.44 20.31 L3.69 17.56 L4.61 15.06 L4.61 15.06 L2.19 13.95 L2.19 10.05 L4.61 8.94 L4.61 8.94 L3.69 6.44 L6.44 3.69 L8.94 4.61 L8.94 4.61 L10.05 2.19 L13.95 2.19 L15.06 4.61 L15.06 4.61 L17.56 3.69 L20.31 6.44 L19.39 8.94Z M15.5 12a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0Z',
    plus: 'M12 5v14 M5 12h14',
    chevron: 'M4 8l8 8 8-8',
    arrow: 'M5 12h14 M12 5l7 7-7 7',
    back: 'M19 12H5 M12 19l-7-7 7-7',
    close: 'M6 6l12 12 M6 18L18 6',
    check: 'M20 6L9 17l-5-5',
    copy: 'M9 9h13v13H9z M5 15H2V2h13v3',
    trash: 'M3 6h18 M8 6V3h8v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
    edit: 'M16 3l5 5 M4 20l4-1L21 6a2 2 0 0 0-3-3L5 16l-1 4z',
    refresh: 'M20 7a8 8 0 1 0 1 8 M20 2v5h-5',
    warning: 'M12 3L2 21h20L12 3z M12 9v5 M12 17h.01',
    info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 11v6 M12 7h.01',
    search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16 M17 17l5 5',
    logout: 'M9 21H3V3h6 M9 12h13 M17 7l5 5-5 5',
    code: 'M8 5L1 12l7 7 M16 5l7 7-7 7 M14 3l-4 18',
    shield: 'M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4z M8 12l3 3 5-6',
    card: 'M2 4h20v16H2z M2 9h20 M6 15h3',
    download: 'M12 3v12 M7 10l5 5 5-5 M3 16v5h18v-5',
    external: 'M15 3h6v6 M10 14L21 3 M21 14v7H3V3h7',
    send: 'M22 2L9 15 M22 2l-7 20-6-7-7-6 20-7z',
    play: 'M8 4l12 8-12 8V4z',
    upload: 'M12 16V3 M7 8l5-5 5 5 M3 16v5h18v-5',
    folder: 'M3 7V4h6l3 3h9v14H3V7z',
    file: 'M14 2H4v20h16V8l-6-6z M14 2v6h6 M8 13h8 M8 17h5',
    cloud: 'M7 19h11a4 4 0 0 0 .5-8 6.5 6.5 0 0 0-12.7-1.6A4.8 4.8 0 0 0 7 19z',
    proxy: 'M4 3h16v6H4z M4 10h16v6H4z M7 6h.01 M11 6h6 M7 13h.01 M11 13h6 M12 16v4 M3 21h6 M15 21h6 M9 19h6v4H9z',
    key: 'M14.5 2a7.5 7.5 0 0 0-6.9 10.4L1 19v4h4l2-2v-2h2l2.6-2.6A7.5 7.5 0 1 0 14.5 2Z M17.5 5.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  };
</script>

<svg
  data-icon={name}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill={name === 'key' ? 'currentColor' : 'none'}
  fill-rule="evenodd"
  stroke={name === 'key' ? 'none' : 'currentColor'}
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  style:color={name === 'key' ? 'var(--icon-color, var(--accent))' : undefined}
  aria-hidden="true">
  {#if name === 'account'}
    <circle cx="12" cy="12" r="10" />
    <path
      class="account-person"
      d="M15 9.5a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z M5 19.14C5.6 16 8 14.5 12 14.5S18.4 16 19 19.14A10 10 0 0 1 5 19.14Z" />
  {:else}
    <path d={paths[name] || paths.info} />
  {/if}
</svg>
