<script lang="ts">
  import markets from '$market';
</script>

<section>
  <h3 class="mt-8 text-3xl font-bold text-neutral-300">Spend and Discover</h3>
  <p class="mt-2 text-sm leading-relaxed">
    We decided to keep it simple. No APIs or middlemen, just a list of places where you can spend crypto privately. Most of these are
    zero-KYC, crypto native, privacy focused and don't require even an account to use. You can find more services and product in the
    directories bellow like <a href="https://kycnot.me" id="kycme">KYCNOT.me</a>
  </p>
  <p class="mb-4 text-sm leading-relaxed text-neutral-500">
    <i>We have no affiliation or sponsorship with the services listed below. The list is updated frequently.</i>
  </p>

  <div class="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each markets as market}
      <a
        href={market.link}
        target="_blank"
        rel="noopener noreferrer"
        data-sveltekit-preload-data="tap"
        class="market-card {market.category.toLowerCase().replace(' ', '-').replace('/', '-')}">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-300/10 p-1.5">
            <img
              src={market.icon}
              alt={market.name}
              class="object-contain opacity-90 {['Bitgild', 'Njalla'].includes(market.name) && 'invert'}"
              loading="lazy" />
          </div>
          <h3 class="font-bold text-neutral-300">{market.name}</h3>
        </div>
        <p class="mb-6 line-clamp-2 text-sm leading-relaxed text-neutral-400">{market.description}</p>
        <div class="flex items-center justify-between text-xs font-medium">
          <span class="tag rounded px-2 py-1 tracking-wider uppercase">{market.tag}</span>
          <span class="text-neutral-600">{market.category}</span>
        </div>
      </a>
    {/each}
  </div>

  <p class="mt-4 text-center text-sm text-neutral-500">
    Know a sovereign service we missed? <a href="/contact">Contact us</a>
    to suggest or recommend a new one.
  </p>
</section>

<style lang="postcss">
  @reference "$style";

  #kycme {
    @apply text-neutral-300 underline decoration-neutral-600 hover:text-neutral-400 hover:decoration-neutral-800;
  }

  .market-card {
    @apply flex flex-col justify-between rounded-xl border border-neutral-700 bg-neutral-800/20 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg;
  }

  .market-card.directories {
    @apply border-yellow-500/50 hover:border-yellow-400;
    .tag {
      @apply bg-yellow-500/20 text-yellow-300;
    }
  }

  .market-card.marketplaces {
    @apply border-fuchsia-500/50 hover:border-fuchsia-400;
    .tag {
      @apply bg-fuchsia-500/20 text-fuchsia-300;
    }
  }

  .market-card.financial-goods {
    @apply border-emerald-500/50 hover:border-emerald-400;
    .tag {
      @apply bg-emerald-500/20 text-emerald-300;
    }
  }

  .market-card.on-off-ramps {
    @apply border-blue-500/50 hover:border-blue-400;
    .tag {
      @apply bg-blue-500/20 text-blue-300;
    }
  }

  .market-card.sovereign-infrastructure {
    @apply border-red-500/50 hover:border-red-400;
    .tag {
      @apply bg-red-500/20 text-red-300;
    }
  }

  .market-card.social-identity {
    @apply border-cyan-500/50 hover:border-cyan-400;
    .tag {
      @apply bg-cyan-500/20 text-cyan-300;
    }
  }
</style>
