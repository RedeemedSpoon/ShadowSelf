<script lang="ts">
  import {card, tower, cloud, email, globe, money, message, server, router, identity} from '$images';
  import {StickyScrollReveal} from '$components';
  import {blur} from 'svelte/transition';

  const content = [
    {
      title: 'Fake a Person',
      description:
        'Easily generate and manage anonymous profiles to shield your personal information online. Use these profiles to sign up for accounts, authenticate services, and maintain privacy. Customize profiles with names, bios, photos, and more, and link them to online account to make it less burdensome.',
      images: [identity, globe],
    },
    {
      title: 'Phone Services',
      description:
        'Generate a functional permanent phone number to use for your profile. Receive and send text messages (SMS) without revealing your personal number. Protect your privacy and avoid unwanted calls or spam. Please note that you cannot make phone calls with a virtual number.',
      images: [message, tower],
    },
    {
      title: 'Email Services',
      description:
        'Generate a private permanent email address and use it for all types of your online activities, including sending, receiving, and registering for accounts. Keep yourself from unwanted emails, spams and phishing attempts.',
      images: [email, router],
    },
    {
      title: 'Payment Services',
      description:
        'Securely manage your finances with anonymous virtual cards and crypto wallets. Enjoy the convenience and privacy of these digital tools. Make online payments, store cryptocurrency, and preserve your very sentitive banking details.',
      images: [money, card],
    },
    {
      title: 'VPN Services',
      description:
        'No solution would be complete without robust privacy measures. Indeed, you can safeguard your online activities with our VPN/proxy services. Generate a unique IP address to mask your location and route your traffic through our secure servers. Enjoy enhanced privacy, bypass censorship, and access geo-restricted content.',
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
