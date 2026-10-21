<script lang="ts">
  import {HOMEPAGE_SERVICES} from '$constant';
  import Icon from '$component/ui/Icon.svelte';
  import ServiceVisual from './ServiceVisual.svelte';
</script>

<div class="profile-tools" id="services">
  {#each HOMEPAGE_SERVICES as service (service.id)}<section
      class="profile-tool"
      id={`feature-${service.id}`}
      style:--service-color={service.color}>
      <div class="tool-inner" data-reveal>
        <div class="profile-tool-heading">
          <span><Icon name={service.icon} size={16} />{service.name}</span>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </div>
        <ServiceVisual service={service.id} />
      </div>
    </section>{/each}
</div>

<style>
  .profile-tools {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .profile-tool {
    padding: 70px 65px 45px;
    border-bottom: 1px solid #a4a8c420;
    background:
      radial-gradient(ellipse at 50% 80%, color-mix(in srgb, var(--service-color) 8%, transparent), transparent 75%),
      #0a1020;
  }
  .profile-tool:nth-child(odd) {
    border-right: 1px solid #a4a8c420;
  }
  .tool-inner {
    max-width: 510px;
    margin: auto;
  }
  .profile-tool-heading > span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
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
  }
  .profile-tool-heading p {
    font-size: 13px;
    line-height: 1.9;
    margin-bottom: 35px;
  }
  @media (max-width: 1050px) {
    .profile-tool {
      padding: 55px 30px 40px;
    }
    .profile-tool-heading h3 {
      font-size: 28px;
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
  }
</style>
