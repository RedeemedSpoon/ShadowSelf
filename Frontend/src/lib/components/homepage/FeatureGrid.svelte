<script lang="ts">
  import {cog, tag, shield, support, handTap, customer, terminal, openSource} from '$image';

  const features = [
    {
      title: 'Open Source',
      description: 'Our service is built on transparency, ensuring reliability, security, and long-term sustainability.',
      image: openSource,
    },
    {
      title: 'Easy to Use',
      description: 'Our service is easy to navigate and use, with a user-friendly interfaces and intuitive features.',
      image: handTap,
    },
    {
      title: 'Affordable to All',
      description:
        'Our competitive prices allow you to get the most out of our service without compromising on any quality or features.',
      image: tag,
    },
    {
      title: 'Extensive & Flexible',
      description: 'We designed our service to adapt to your unique needs and workflows, ensuring the best experience.',
      image: cog,
    },
    {
      title: 'Secure by default',
      description: 'We use Robust security measures & industries best practices to ensure the protection of your data.',
      image: shield,
    },
    {
      title: 'Build-in API',
      description: 'Our built-in API provides a powerful tool for developers to programmatically interact with our service.',
      image: terminal,
    },
    {
      title: '24/7 Customer Support',
      description: 'We are always available and ready to assist you, ensuring a seamless and positive experience.',
      image: support,
    },
    {
      title: 'Money Back Guarantee',
      description: 'We offer you a money-back guarantee to demonstrate our commitment to customer satisfaction.',
      image: customer,
    },
  ];
</script>

<div class="grid grid-cols-2 px-[6vw] max-sm:scale-75 xl:grid-cols-4 xl:max-2xl:px-[3vw]">
  {#each features as feature, index (index)}
    <div class="cell" class:bottom-cells={index + 1 > 4} class:border-r={(index + 1) % 4 === 0}>
      <img src={feature.image} alt={feature.title} />
      <h3 class="text-2xl font-bold md:text-3xl">{feature.title}</h3>
      <p class="hidden text-lg !leading-8 text-neutral-400 lg:block">{feature.description}</p>
    </div>
  {/each}
</div>

<style lang="postcss">
  .cell {
    @apply flex flex-col items-baseline justify-center gap-4 border-l border-neutral-700 p-8 transition-all duration-500 ease-in-out;
    @apply bg-size-200 bg-pos-0 hover:bg-pos-100 bg-gradient-to-t from-neutral-800/75 to-neutral-900 max-xl:border;
  }

  .cell.bottom-cells {
    @apply bg-size-200 bg-pos-100 hover:bg-pos-0 bg-gradient-to-b from-neutral-800/75 to-neutral-900;
    @apply border-t border-neutral-700;
  }

  img {
    @apply h-14 w-14;
  }
</style>
