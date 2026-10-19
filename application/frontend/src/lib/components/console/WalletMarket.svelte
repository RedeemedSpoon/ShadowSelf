<script lang="ts">
  import {MARKETS} from '$lib/constants/markets';
  import Icon from '$component/ui/Icon.svelte';
</script>

<section>
  <div class="section-heading">
    <div>
      <h3>Markets</h3>
    </div>
  </div>
  <p class="directory-note">Independent services. Provider terms and fees apply.</p>
  <div class="market-grid">
    {#each MARKETS as market (market.link)}
      <a
        class="panel market-card"
        href={market.link}
        target="_blank"
        rel="noopener noreferrer"
        referrerpolicy="no-referrer">
        <div class="market-heading">
          <h3>{market.name}</h3>
          <Icon name="arrow" size={16} />
        </div>
        <p>{market.description}</p>
        <span class="badge">{market.category}</span>
      </a>
    {/each}
  </div>
</section>

<style>
  .directory-note {
    font-size: 12px;
    line-height: 1.8;
    margin-bottom: 20px;
  }
  .market-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .market-card {
    display: block;
    margin: 0 !important;
    text-decoration: none;
  }
  .market-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
  }
  .market-card p {
    font-size: 12px;
    line-height: 1.8;
    margin: 12px 0 18px;
  }
  .market-card:hover {
    border-color: #9384e575;
  }
  @media (max-width: 1000px) {
    .market-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .market-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
