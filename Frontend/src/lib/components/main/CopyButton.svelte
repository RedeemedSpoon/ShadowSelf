<script lang="ts">
  import {ReactiveButton} from '$component';
  import {CopyIcon} from '$icon';

  interface Props {
    className?: string;
    text: string;
    change?: boolean;
  }

  let {text, className, change = true}: Props = $props();

  const callback = () => navigator.clipboard.writeText(text);
</script>

<ReactiveButton isBox={true} {className} {text} icon={CopyIcon} {callback} newText={change ? 'Copied!' : text} />
