<script lang="ts">
  import {darkLogo} from '$lib';
</script>

<img src={darkLogo} alt="App" width="512" height="512" />
<p>click that button to start developing the app!</p>
<button>Begin 😃</button>


<style lang="postcss">
  img {
    @apply mt-52;
  }

  p {
    @apply mt-8 text-neutral-300 text-4xl;
  }

  button {
    @apply mt-8 text-4xl text-neutral-300 bg-primary-700 p-6 rounded-md hover:bg-primary-900 shadow-xl shadow-primary-900 transition-all hover:shadow-primary-950;
  }
</style>
