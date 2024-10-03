<script lang="ts">
  import {logo} from '$images';
  import {authenticated} from '$store';
</script>

<div>
  <img src={logo} alt="App" width="512" height="512" />
  <p>Click that button to start your amazing journey!</p>
  <button on:click={() => ($authenticated = !$authenticated)}>Begin 😃</button>
</div>

<style lang="postcss">
  div {
    @apply mt-24 flex flex-col items-center justify-center gap-8;
  }

  button {
    @apply p-6 text-3xl;
  }
</style>
