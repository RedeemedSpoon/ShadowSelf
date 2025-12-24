<script lang="ts">
  import {proxy, email, crypto, phone, identity} from '$image';
  import {StickyScrollReveal, TracingBeam} from '$component';
  import type {ServicesContent} from '$type';
  import {blur} from 'svelte/transition';

  const content: ServicesContent[] = [
    {
      images: identity,
      title: 'Fake a Person',
      style: '--shadow-color-rgb: 79, 70, 229;',
      description:
        'Create and manage private identities to shield your personal information. Customize them with names, bios, photos, etc. Then use them to sign up for accounts, authenticate to services, and maintain your sensitive data from the public eye.',
    },
    {
      images: email,
      title: 'Email Services',
      style: '--shadow-color-rgb: 225, 29, 72;',
      description:
        'Each identity comes with a permanent email address. Utilize it for sending and receiving and confirming emails. Keep yourself from unwanted emails, advertisements, spams and phishing attempts.',
    },
    {
      images: phone,
      title: 'Phone Services',
      style: '--shadow-color-rgb: 2, 132, 199;',
      description:
        'Each identity also comes with a functional permanent phone number. Use it to receive and send text messages. Protect yourself and avoid annoying SMS or scams. Please note that you cannot make phone calls with it (yet).',
    },
    {
      images: crypto,
      title: 'Payment Services',
      style: '--shadow-color-rgb: 22, 163, 74;',
      description:
        'Bypass the banking system entirely. Manage your wealth with a sovereign, non-custodial wallet designed for anonymity. Spend instantly on real-world goods via untraceable gift cards and scrub your digital trail with built-in asset swapping.',
    },
    {
      images: proxy,
      title: 'VPN Services',
      style: '--shadow-color-rgb: 217, 119, 6;',
      description:
        'Finally Each identity has an address to disguise your location and route your traffic through our secure servers, making sure to bypass monitoring and interception from malicious threats.',
    },
  ];
</script>

<TracingBeam>
  <StickyScrollReveal {content}>
    {#snippet text({item})}
      <div id="text" class:opacity-30={item.activeCard !== item.index}>
        <h1 class="text-5xl font-normal md:text-7xl 2xl:text-nowrap">{item.title}</h1>
        <p>{item.description}</p>
        {#if item.activeCard === 0}
          <p class="mt-4 animate-bounce text-neutral-500">↓ Scroll down for more</p>
        {/if}
      </div>
    {/snippet}

    {#snippet image({item})}
      <div id="box" in:blur={{opacity: 1, amount: 5, duration: 500}}>
        <img loading="lazy" src={item.images} style={item.style} alt={item.title} />
      </div>
    {/snippet}
  </StickyScrollReveal>
</TracingBeam>

<style lang="postcss">
  @reference "$style";

  #text {
    @apply flex h-full min-w-[325px] snap-center flex-col justify-start gap-4 pt-16 text-balance max-xl:ml-32 max-md:mx-[10vw];
  }

  #box {
    @apply relative h-full w-full rounded-2xl bg-[#070d1f];
  }

  #box > img {
    @apply animate-shake image-shadow absolute top-6 right-0 bottom-0 left-0 m-auto w-2/3 transition-all duration-300 ease-in-out;
  }
</style>
