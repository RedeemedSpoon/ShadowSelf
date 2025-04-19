<script lang="ts">
  interface Props {
    size?: string;
    className?: string;
    delay?: number;
  }

  let {size = 'w-5 h-5', className, delay}: Props = $props();

  const gradientId = `sparkleGradient-${Math.random().toString(36).substring(2, 15)}`;
  const colorStart = '#0284c7';
  const colorMid = '#4f46e5';
  const colorEnd = '#9333ea';
</script>

<div style="--delay: {delay ?? 0}" class={'animate-sparkle absolute max-md:hidden ' + className}>
  <svg class="block overflow-visible {size}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="url(#{gradientId})">
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color={colorStart} />
        <stop offset="50%" stop-color={colorMid} />
        <stop offset="100%" stop-color={colorEnd} />
      </linearGradient>
    </defs>
    <polygon points="10,0 13,7 20,10 13,13 10,20 7,13 0,10 7,7" />
  </svg>
</div>
