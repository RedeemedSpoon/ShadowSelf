<script lang="ts">
  export let color: string = 'currentColor';
  export let rotation: number = 0;
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
  <path
    fill={color}
    transform="rotate({rotation}, 10, 10)"
    d="M10 0a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM2 10a8 8 0 1 0 16 0 8 8 0 0 0-16 0zm10.54.7L9 14.25l-1.41-1.41L10.4 10 7.6 7.17 9 5.76 13.24 10l-.7.7z" />
</svg>

<style lang="postcss">
  svg {
    @apply h-6 w-6 cursor-pointer transition-colors ease-in-out;
  }
</style>
