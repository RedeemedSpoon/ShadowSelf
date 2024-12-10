<script lang="ts">
  import {LoadingButton} from '$component';

  interface Props {
    name: string;
    type: string;
    value?: string;
    label?: string;
    placeholder?: string;
  }

  let {name, label, type, value, placeholder}: Props = $props();
</script>

<div class="flex flex-initial">
  <input class="alternative !rounded-r-none ring-inset" {placeholder} {name} {type} {value} required />
  <LoadingButton className="rounded-l-none -ml-1">{label}</LoadingButton>
</div>
