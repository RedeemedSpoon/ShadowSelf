<script lang="ts">
  import {LoadingButton} from '$component';

  interface Props {
    name: string;
    type?: string;
    index?: number;
    value?: string;
    label?: string;
    placeholder?: string;
  }

  let {index = 0, type = 'text', name, label, value, placeholder}: Props = $props();
</script>

<div class="flex flex-initial max-md:flex-col max-md:gap-6">
  <input class="w-full md:rounded-r-none! md:ring-inset" {placeholder} {name} {type} {value} required />
  <LoadingButton {index} className="text-nowrap md:rounded-l-none md:-ml-1">{label}</LoadingButton>
</div>
