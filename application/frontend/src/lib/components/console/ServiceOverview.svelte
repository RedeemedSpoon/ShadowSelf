<script lang="ts">
  import {HOMEPAGE_SERVICES, SERVICE_GUIDES} from '$constant';
  import type {FullIdentity, HomepageServiceId} from '$type';
  import Icon from '$component/ui/Icon.svelte';

  let {account, service = 'card'}: {account: FullIdentity; service?: HomepageServiceId} = $props();
  const guide = $derived(SERVICE_GUIDES[service]);
  const feature = $derived(HOMEPAGE_SERVICES.find((item) => item.id === service)!);
</script>

<section class="panel service-overview" data-feature={service}>
  <div class="section-heading">
    <div>
      <h2><Icon name={feature.icon} size={21} />{guide.title}</h2>
      <p>{guide.introduction}</p>
    </div>
    <span class="identity-label">{account.name}</span>
  </div>
  <div class="service-tools">
    {#each guide.tools as tool (tool.name)}
      <article>
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
      </article>
    {/each}
  </div>
  <div class="service-note">
    <Icon name="info" size={17} />
    <p>{guide.note}</p>
  </div>
  <a class="text-link" href={`/docs#service-${service}`}>
    <Icon name="code" size={16} />Read the {guide.title.toLowerCase()} guide
  </a>
</section>

<style>
  .section-heading {
    flex-wrap: wrap;
    gap: 14px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  h2 :global(svg) {
    flex-shrink: 0;
  }
  .identity-label {
    color: var(--muted);
    font-size: 11px;
  }
  .service-tools {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-block: 26px;
    border-block: 1px solid var(--line);
  }
  article {
    padding: 22px 20px;
  }
  article:first-child {
    padding-left: 0;
  }
  article:last-child {
    padding-right: 0;
  }
  article + article {
    border-left: 1px solid var(--line);
  }
  h3 {
    color: var(--feature-accent);
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 12px;
  }
  p {
    font-size: 12px;
    line-height: 1.8;
    color: var(--muted);
  }
  .service-note {
    display: flex;
    align-items: start;
    gap: 10px;
    margin-bottom: 22px;
  }
  .service-note :global(svg) {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--feature-accent);
  }
  @media (max-width: 800px) {
    .service-tools {
      grid-template-columns: 1fr;
    }
    article,
    article:first-child,
    article:last-child {
      padding: 18px 0;
    }
    article + article {
      border-left: 0;
      border-top: 1px solid var(--line);
    }
  }
</style>
