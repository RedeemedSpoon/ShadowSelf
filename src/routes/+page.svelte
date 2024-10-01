<script lang="ts">
  import '../app.css';
  import {logo} from '$lib';
</script>

<h1>ShadowSelf</h1>
<p>
  Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsum cupiditate quidem magnam dolorum hic accusamus
  dignissimos eligendi. Deserunt consequatur minus cum in tenetur. Atque, tempore placeat. Repellendus perferendis animi
  sint?
</p>
<img src={logo} alt="App" width="512" height="512" />
<img src={logo} alt="App" width="256" height="256" />

<style lang="postcss">
  :global(body) {
    @apply flex flex-col items-center gap-4 bg-neutral-900 text-neutral-300;
  }

  h1 {
    @apply mt-52 text-6xl font-semibold text-primary-700 shadow-primary-900 drop-shadow-2xl [text-shadow:5px_5px_50px_var(--tw-shadow-color)];
  }
  p {
    @apply max-w-4xl text-center text-2xl;
  }

  img {
    @apply mt-10;
  }
</style>
