<script lang="ts">
  import {card, tower, cloud, email, globe, money, message, server, router, identity} from '$image';
  import {StickyScrollReveal, TracingBeam} from '$component';
  import type {ServicesContent} from '$type';
  import {blur} from 'svelte/transition';

  const content: ServicesContent[] = [
    {
      title: 'Fake a Person',
      description:
        'Create and manage anonymous identities to shield your personal information online. Customize them with names, bios, photos, etc. Then use them to sign up for accounts, authenticate to services, and maintain your sensitive data from the public eye...',
      images: [identity, globe],
    },
    {
      title: 'Phone Services',
      description:
        'Generate a functional permanent phone number to use for your profile. Use them to receive and send text messages (SMS). Protect yourself and avoid annoying calls or scams. Please note that you cannot make phone calls with a virtual number.',
      images: [message, tower],
    },
    {
      title: 'Email Services',
      description:
        'Generate a private permanent email address and use it for your online activities, including sending and receiving and confirming emails. Keep yourself from unwanted emails, advertisements, spams and phishing attempts.',
      images: [email, router],
    },
    {
      title: 'Payment Services',
      description:
        'Securely manage your finances with anonymous working virtual cards. Enjoy the convenience and privacy of these digital tools, and preserve your very sentitive banking details.',
      images: [money, card],
    },
    {
      title: 'VPN Services',
      description:
        'No solution would be complete without a vpn. As expected, you can use our vpn/proxy service to mask your location and route your traffic through our secure servers. Enjoy enhanced privacy, bypass censorship, and access geo-restricted content.',
      images: [server, cloud],
    },
  ];
</script>

<TracingBeam>
  <StickyScrollReveal {content}>
    {#snippet text({item})}
      <div id="text" class:opacity-30={item.activeCard !== item.index}>
        <h1 class="text-5xl font-normal md:text-7xl 2xl:text-nowrap">{item.title}</h1>
        <p>{item.description}</p>
      </div>
    {/snippet}

    {#snippet image({item})}
      <div id="box" in:blur={{opacity: 1, amount: 5, duration: 500}}>
        <img loading="lazy" src={item.images[0]} alt={item.title} />
        <img loading="lazy" src={item.images[1]} alt={item.title} />
      </div>
    {/snippet}
  </StickyScrollReveal>
</TracingBeam>

<style lang="postcss">
  #text {
    @apply flex h-full min-w-[325px] snap-center flex-col justify-start gap-4 text-balance pt-16 max-xl:ml-32 max-md:mx-[10vw];
  }

  #box {
    @apply relative h-full w-full rounded-2xl bg-[#070d1f];
  }

  #box > img {
    @apply animate-shake image-shadow absolute h-1/3 object-contain transition-all duration-300 ease-in-out;
    @apply first:bottom-12 first:right-20 last:left-16 last:top-24;
  }
</style>
