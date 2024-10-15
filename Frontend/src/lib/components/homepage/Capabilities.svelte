<script lang="ts">
  import {card, wifi, cloud, email, globe, money, phone, server, unknown, identity} from '$images';
  import {StickyScrollReveal} from '$components';

  const content = [
    {
      title: 'Identity Services',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec nibh et massa aliquam pharetra sit amet sit amet ante. Sed arcu sapien, convallis a dui eget, porta lacinia purus. Cras euismod nunc ut enim hendrerit varius. Quisque ac malesuada ligula. Morbi lorem nibh, vehicula nec elit et, mattis blandit massa. Vivamus aliquet magna et metus auctor mollis.',
      images: [unknown, identity],
    },
    {
      title: 'Email Services',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec nibh et massa aliquam pharetra sit amet sit amet ante. Sed arcu sapien, convallis a dui eget, porta lacinia purus. Cras euismod nunc ut enim hendrerit varius. Quisque ac malesuada ligula. Morbi lorem nibh, vehicula nec elit et, mattis blandit massa. Vivamus aliquet magna et metus auctor mollis.',
      images: [email, globe],
    },
    {
      title: 'Phone Services',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec nibh et massa aliquam pharetra sit amet sit amet ante. Sed arcu sapien, convallis a dui eget, porta lacinia purus. Cras euismod nunc ut enim hendrerit varius. Quisque ac malesuada ligula. Morbi lorem nibh, vehicula nec elit et, mattis blandit massa. Vivamus aliquet magna et metus auctor mollis.',
      images: [phone, wifi],
    },
    {
      title: 'Payment Services',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec nibh et massa aliquam pharetra sit amet sit amet ante. Sed arcu sapien, convallis a dui eget, porta lacinia purus. Cras euismod nunc ut enim hendrerit varius. Quisque ac malesuada ligula. Morbi lorem nibh, vehicula nec elit et, mattis blandit massa. Vivamus aliquet magna et metus auctor mollis.',
      images: [money, card],
    },
    {
      title: 'Proxy Services',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec nibh et massa aliquam pharetra sit amet sit amet ante. Sed arcu sapien, convallis a dui eget, porta lacinia purus. Cras euismod nunc ut enim hendrerit varius. Quisque ac malesuada ligula. Morbi lorem nibh, vehicula nec elit et, mattis blandit massa. Vivamus aliquet magna et metus auctor mollis.',
      images: [server, cloud],
    },
  ];
</script>

<StickyScrollReveal {content}>
  <div id="text" slot="text" let:item class:opacity-30={item.activeCard !== item.index}>
    <h1 class="text-7xl font-normal">{item.title}</h1>
    <p>{item.description}</p>
  </div>

  <div id="box" slot="image" let:item >
    <img src={item.images[0]} alt={item.title} />
    <img src={item.images[1]} alt={item.title} />
  </div>
</StickyScrollReveal>

<style lang="postcss">
  #text {
    @apply flex h-5/6 flex-col justify-center gap-8 text-balance text-2xl leading-relaxed;
    @apply last:mb-32;
  }

  #box {
    @apply animate-border sticky top-32 h-2/3 w-1/3 rounded-2xl border-4 border-transparent p-8;
    @apply [background:linear-gradient(45deg,#172033,theme(colors.neutral.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.neutral.600/.48)_80%,_theme(colors.primary.500)_86%,_theme(colors.primary.300)_90%,_theme(colors.primary.500)_94%,_theme(colors.neutral.600/.48))_border-box];
  }

  #box img {
    @apply animate-shake relative h-2/5 object-contain transition-all duration-300 ease-in-out;
    @apply drop-shadow-[5px_15px_20px_rgba(2,6,23,0.75)] hover:drop-shadow-[5px_15px_35px_rgba(2,6,23,1)];

    &:nth-child(1) {
      @apply left-1/2 top-80 translate-x-[-50%];
    }

    &:nth-child(2) {
      @apply bottom-36 translate-x-[50%];
    }
  }
</style>
