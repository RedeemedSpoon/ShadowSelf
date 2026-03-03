<script lang="ts">
  import {ReactiveButton} from '$component';
  import {CopyIcon} from '$icon';

  interface Props {
    className?: string;
    otherAlt?: boolean;
    change?: boolean;
    label?: string;
    alt?: boolean;
    text: string;
  }

  let {text, className, label, otherAlt = false, alt = false, change = true}: Props = $props();

  const callback = () => navigator.clipboard.writeText(text);
  const showntext = label || text;

  const upperClassname = alt ? 'group flex-row-reverse! justify-between px-0 py-3 w-full!' : '';
  const otherClassname = alt ? 'text-left! group-hover:text-neutral-400 text-neutral-300 w-full' : '';
  const iconClassname = alt ? 'group-hover:block hidden text-neutral-400' : '';
  const iconSvgClassname = otherAlt ? '!w-5! h-5! -mt-1! fill-none!' : '';

  const classes = {
    iconClassname,
    className: `${className || ''} ${otherClassname || ''}`,
    iconSvgClassname,
    upperClassname,
    isBox: !alt,
  };
</script>

<ReactiveButton {...classes} text={showntext} icon={CopyIcon} {callback} newText={change ? 'Copied!' : showntext} />
