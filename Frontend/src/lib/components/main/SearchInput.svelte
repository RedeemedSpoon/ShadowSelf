<script lang="ts">
  import {Input} from '$component';
  import {SearchIcon} from '$icon';

  interface Props {
    keywords: {label: string; value: string}[];
    handleSearch: (result: string[]) => void;
  }

  const {keywords, handleSearch}: Props = $props();

  const handleInput = () => {
    const input = document.getElementById('search') as HTMLInputElement;
    const result = keywords.filter((keyword) => keyword.value.toLowerCase().includes(input.value.toLowerCase()));
    handleSearch(result.map((keyword) => keyword.label));
  };

  const classes = {
    wrapper: '!flex-row-reverse',
    input: '!placeholder-neutral-600 !w-32 !rounded-none !border-0 !border-b-2 !border-neutral-400 !bg-transparent !ring-0',
    label: '!-ml-6 !rounded-none !border-0 !border-b-2 !border-neutral-400 !bg-transparent !ring-0',
    icon: '!stroke-neutral-600 group-focus-within:!stroke-neutral-400 !cursor-default !fill-none',
  };
</script>

<div class="group flex items-center">
  <Input className={classes} type="text" placeholder="Search" icon={SearchIcon} name="search" {handleInput} />
</div>
