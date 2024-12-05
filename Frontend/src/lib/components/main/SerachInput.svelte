<script lang="ts">
  import {SearchIcon} from '$icon';

  interface Props {
    keyword: string[];
    handleSearch: (result: string[]) => void;
  }

  const {keyword, handleSearch}: Props = $props();

  const handleInput = (e: Event) => {};
</script>

<div class="group flex items-center">
  <input type="search" placeholder="Search" oninput={handleInput} />
  <button>
    <SearchIcon className="stroke-neutral-800" />
  </button>
</div>

<style lang="postcss">
  input {
    @apply w-full !rounded-l-full !rounded-r-none !px-4 !py-3;
  }

  button {
    @apply !rounded-l-none !rounded-r-full py-3 pl-3 pr-4 shadow-none;
  }
</style>
