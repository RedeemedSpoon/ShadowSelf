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

<div class="flex flex-initial">
  <input class="w-full !rounded-r-none ring-inset" {placeholder} {name} {type} {value} required />
  <LoadingButton {index} className="text-nowrap rounded-l-none -ml-1">{label}</LoadingButton>
</div>
