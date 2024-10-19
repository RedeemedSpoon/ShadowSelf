<script lang="ts">
  import {cog, tag, shield, support, handTap, customer, terminal, openSource} from '$images';
  const features = [
    {
      title: 'Open Source',
      description:
        'Our service is built on transparency, ensuring reliability, security, and long-term sustainability.',
      image: openSource,
      index: 1,
    },
    {
      title: 'Easy to Use',
      description: 'Our service is easy to navigate and use, with a user-friendly interfaces and intuitive features.',
      image: handTap,
      index: 2,
    },
    {
      title: 'Affordable to All',
      description:
        'Our competitive prices allow you to get the most out of our service without compromising on any quality or features.',
      image: tag,
      index: 3,
    },
    {
      title: 'Extensive & Flexible',
      description: 'We designed our service to adapt to your unique needs and workflows, ensuring the best experience.',
      image: cog,
      index: 4,
    },
    {
      title: 'Secure by default',
      description: 'We use Robust security measures & industries best practices to ensure the protection of your data.',
      image: shield,
      index: 5,
    },
    {
      title: 'Build-in API',
      description:
        'Our built-in API provides a powerful tool for developers to programmatically interact with our service.',
      image: terminal,
      index: 6,
    },
    {
      title: '24/7 Customer Support',
      description: 'We are always available and ready to assist you, ensuring a seamless and positive experience.',
      image: support,
      index: 7,
    },
    {
      title: 'Money Back Guarantee',
      description: 'We offer you a money-back guarantee to demonstrate our commitment to customer satisfaction.',
      image: customer,
      index: 8,
    },
  ];
</script>

<div class="grid h-3/4 w-full grid-cols-4 border-r border-neutral-700 px-24">
  {#each features as feature (feature.index)}
    <div id="cell" class:bottom-cells={feature.index > 4} class:border-r={feature.index % 4 === 0}>
      <img src={feature.image} alt={feature.title} />
      <h3 class="text-3xl font-bold">{feature.title}</h3>
      <p class="text-lg !leading-8 text-neutral-400">{feature.description}</p>
    </div>
  {/each}
</div>

<style lang="postcss">
  img {
    @apply h-14 w-14;
  }

  #cell {
    @apply flex flex-col items-baseline justify-center gap-4 border-l border-neutral-700 p-8 transition-all duration-500 ease-in-out;
    @apply bg-size-200 bg-pos-0 hover:bg-pos-100 bg-gradient-to-t from-neutral-800/75 to-neutral-900;
  }

  #cell.bottom-cells {
    @apply border-t border-neutral-700;
    @apply bg-size-200 bg-pos-100 hover:bg-pos-0 bg-gradient-to-b from-neutral-800/75 to-neutral-900;
  }
</style>
