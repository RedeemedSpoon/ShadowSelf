<script lang="ts">
  import {HOMEPAGE_SERVICES} from '$constant';
  import ServiceVisual from './ServiceVisual.svelte';
</script>

<div class="profile-tools" id="services">
  {#each HOMEPAGE_SERVICES as service (service.id)}<section
      class="profile-tool"
      class:wallet-feature={service.id === 'wallet'}
      id={`feature-${service.id}`}
      style:--service-color={service.color}>
      <div class="tool-inner" data-reveal>
        <div class="profile-tool-heading">
          <span>{service.name}</span>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </div>
        <ServiceVisual service={service.id} />
      </div>
    </section>{/each}
</div>

<section class="planned-tools" id="planned-tools">
  <div class="chapter-width" data-reveal>
    <div class="planned-heading">
      <h2>On the roadmap.</h2>
      <span>Planned</span>
    </div>
    <div class="planned-list">
      <article>
        <h3>Residential routing</h3>
        <p>Residential proxy routing managed per identity.</p>
      </article>
      <article>
        <h3>Email aliases and PGP</h3>
        <p>More addresses for each identity and support for encrypted email.</p>
      </article>
      <article>
        <h3>Cards and cloud storage</h3>
        <p>Virtual cards and a cloud drive for each identity.</p>
      </article>
    </div>
  </div>
</section>

<style>
  .profile-tools {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .profile-tool {
    padding: 70px 65px 45px;
    border-bottom: 1px solid #a4a8c420;
    background: radial-gradient(ellipse at 50% 80%, color-mix(in srgb, var(--service-color) 8%, transparent), transparent 75%), #0a1020;
  }
  .profile-tool:nth-child(odd) {
    border-right: 1px solid #a4a8c420;
  }
  .tool-inner {
    max-width: 510px;
    margin: auto;
  }
  .profile-tool-heading > span {
    font-size: 13px;
    color: var(--service-color);
  }
  .profile-tool-heading h3 {
    font-size: 32px;
    letter-spacing: -1px;
    line-height: 1.3;
    font-weight: 500;
    color: #e4e5f3;
    margin: 20px 0;
    min-height: 70px;
  }
  .profile-tool-heading p {
    font-size: 13px;
    line-height: 1.9;
    min-height: 75px;
    margin-bottom: 35px;
  }
  .profile-tool.wallet-feature {
    grid-column: 1 / -1;
    border-right: 0;
  }
  .wallet-feature .tool-inner {
    max-width: 1160px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 100px;
    align-items: center;
  }
  .wallet-feature .profile-tool-heading h3,
  .wallet-feature .profile-tool-heading p {
    min-height: 0;
  }
  .wallet-feature :global(.service-visual) {
    grid-column: 2;
    grid-row: 1;
  }
  .planned-tools {
    background: #0d1326;
    border-bottom: 1px solid #a4a8c420;
    padding-block: 38px 42px;
  }
  .planned-heading {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 25px;
  }
  .planned-heading h2 {
    font-size: 22px;
    letter-spacing: -0.5px;
  }
  .planned-heading > span {
    padding: 5px 9px;
    border: 1px solid #a5b4fc35;
    border-radius: 4px;
    color: #a5b4fc;
    font-size: 10px;
  }
  .planned-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 35px;
  }
  .planned-list h3 {
    color: #cbd5ef;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 10px;
  }
  .planned-list p {
    font-size: 12px;
    line-height: 1.8;
  }
  @media (max-width: 1050px) {
    .profile-tool {
      padding: 55px 30px 40px;
    }
    .profile-tool-heading h3 {
      font-size: 28px;
    }
    .profile-tool-heading p {
      min-height: 100px;
    }
    .wallet-feature .tool-inner {
      column-gap: 40px;
    }
  }
  @media (max-width: 700px) {
    .profile-tools {
      grid-template-columns: 1fr;
    }
    .profile-tool {
      padding: 55px 22px 35px;
      border-right: 0 !important;
    }
    .profile-tool-heading h3,
    .profile-tool-heading p {
      min-height: 0;
    }
    .profile-tool-heading h3 {
      font-size: 31px;
    }
    .profile-tool-heading p {
      font-size: 14px;
    }
    .wallet-feature .tool-inner {
      display: block;
    }
    .planned-list {
      grid-template-columns: 1fr;
      gap: 22px;
    }
    .planned-heading {
      gap: 12px;
    }
    .planned-heading h2 {
      font-size: 21px;
    }
  }
</style>
