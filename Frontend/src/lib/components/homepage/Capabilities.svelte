<script lang="ts">
  import {card, tower, cloud, email, globe, money, message, server, router, identity} from '$images';
  import {StickyScrollReveal} from '$components';
  import {blur} from 'svelte/transition';

  const content = [
    {
      title: 'Identity Services',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec nibh et massa aliquam pharetra sit amet sit amet ante. Sed arcu sapien, convallis a dui eget, porta lacinia purus. Cras euismod nunc ut enim hendrerit varius. Quisque ac malesuada ligula. Morbi lorem nibh, vehicula nec elit et, mattis blandit massa. Vivamus aliquet magna et metus auctor mollis.',
      images: [identity, globe],
    },
    {
      title: 'Phone Services',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec nibh et massa aliquam pharetra sit amet sit amet ante. Sed arcu sapien, convallis a dui eget, porta lacinia purus. Cras euismod nunc ut enim hendrerit varius. Quisque ac malesuada ligula. Morbi lorem nibh, vehicula nec elit et, mattis blandit massa. Vivamus aliquet magna et metus auctor mollis.',
      images: [message, tower],
    },
    {
      title: 'Email Services',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec nibh et massa aliquam pharetra sit amet sit amet ante. Sed arcu sapien, convallis a dui eget, porta lacinia purus. Cras euismod nunc ut enim hendrerit varius. Quisque ac malesuada ligula. Morbi lorem nibh, vehicula nec elit et, mattis blandit massa. Vivamus aliquet magna et metus auctor mollis.',
      images: [email, router],
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

  <div id="box" slot="image" let:item in:blur={{opacity: 1, amount: 5, duration: 500}}>
    <img src={item.images[0]} alt={item.title} />
    <img src={item.images[1]} alt={item.title} />
  </div>
</StickyScrollReveal>

<style lang="postcss">
  #text {
    @apply flex h-full snap-center flex-col justify-center gap-4 text-balance text-2xl leading-relaxed;
  }

  #box {
    @apply card sticky h-full w-full rounded-2xl p-12;
  }

  #box img {
    @apply animate-shake absolute h-1/3 object-contain transition-all duration-300 ease-in-out;
    @apply drop-shadow-[5px_5px_15px_rgba(148,163,184,0.20)] hover:drop-shadow-[10px_15px_25px_rgba(148,163,184,0.25)];

    &:nth-child(1) {
      @apply bottom-12 right-20;
    }

    &:nth-child(2) {
      @apply left-16 top-24;
    }
  }
</style>
