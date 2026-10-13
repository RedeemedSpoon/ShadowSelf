<script lang="ts">
  import {HOMEPAGE_IDENTITY_EXAMPLES} from '$constant';
  import theoPortrait from '$image/homepage/profile-pictures/theo-mercer.webp';
  import maraPortrait from '$image/homepage/profile-pictures/mara-soler.webp';
  import samirPortrait from '$image/homepage/profile-pictures/samir-nassar.webp';

  const portraits = [theoPortrait, maraPortrait, samirPortrait];
  const views = [
    {id: 'accounts', name: 'Account vault'},
    {id: 'messages', name: 'Email'},
  ] as const;

  let selected = $state(0);
  let view = $state<(typeof views)[number]['id']>('accounts');
  let identity = $derived(HOMEPAGE_IDENTITY_EXAMPLES[selected]);
</script>

<section class="identities" id="multiple-identities">
  <div class="chapter-width">
    <div class="identities-heading" data-reveal>
      <h2>Different parts of your life.<br /><span>Different identities.</span></h2>
      <p>
        Give your community accounts, public projects, and shopping separate profiles and inboxes. Switch identities to see the accounts and messages that
        belong to each.
      </p>
    </div>
    <div class="identity-demo" data-reveal>
      <div class="identity-choices" aria-label="Example identities">
        {#each HOMEPAGE_IDENTITY_EXAMPLES as example, index (example.name)}
          <button aria-pressed={selected === index} style:--identity-color={example.color} onclick={() => (selected = index)}>
            <img src={portraits[index]} alt="" loading="lazy" />
            <span><strong>{example.purpose}</strong><small>{example.name}</small></span>
            <span class="choice-arrow" aria-hidden="true">↗</span>
          </button>
        {/each}
      </div>
      <div class="identity-workspace" style:--identity-color={identity.color}>
        <div class="demo-label"><span><i></i>Identity workspace</span><span>Interactive example</span></div>
        <div class="workspace-content" aria-live="polite" aria-atomic="true">
          {#key selected}
            <div class="identity-overview">
              <img src={portraits[selected]} alt={`Example profile for ${identity.name}`} loading="lazy" />
              <div>
                <span>{identity.purpose}</span>
                <h3>{identity.name}</h3>
                <code>@{identity.handle}</code>
              </div>
            </div>
            <p class="identity-description">{identity.description}</p>
            <dl class="identity-contact">
              <div>
                <dt>Email</dt>
                <dd>{identity.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{identity.phone}</dd>
              </div>
            </dl>
          {/key}
        </div>
        <div class="workspace-views" aria-label="Example identity tools">
          {#each views as item (item.id)}<button aria-pressed={view === item.id} onclick={() => (view = item.id)}>{item.name}</button>{/each}
        </div>
        <div class="workspace-records" aria-live="polite" aria-atomic="true">
          {#key `${selected}-${view}`}
            <div class="record-list">
              {#each identity[view] as record (record.name)}
                <div class="record-row">
                  <span class="record-symbol" aria-hidden="true">{view === 'accounts' ? '↗' : view === 'messages' ? '@' : '↳'}</span>
                  <div><strong>{record.name}</strong><span>{record.detail}</span></div>
                  {#if view === 'accounts'}<span class="saved-password" aria-label="Hidden password">••••••••</span>{/if}
                </div>
              {/each}
            </div>
          {/key}
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .identities {
    padding-block: 110px;
    background: radial-gradient(ellipse at 70% 70%, #4338ca15, transparent 60%), #0d1225;
    border-block: 1px solid #a5b4fc14;
  }
  .identities-heading {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    align-items: center;
    gap: 65px;
    margin-bottom: 55px;
  }
  .identities-heading h2 {
    font-size: clamp(35px, 3.6vw, 49px);
    letter-spacing: -1.8px;
  }
  .identities-heading h2 span {
    color: var(--color-indigo-300);
  }
  .identities-heading p {
    font-size: 14px;
  }
  .identity-demo {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 25px;
    align-items: start;
  }
  .identity-choices {
    display: grid;
    gap: 12px;
  }
  .identity-choices button {
    display: flex;
    gap: 14px;
    align-items: center;
    text-align: left;
    padding: 20px 17px;
    background: #121a2d;
    border: 1px solid #94a3b820;
    box-shadow: none;
    border-radius: 8px;
  }
  .identity-choices button[aria-pressed='true'] {
    border-color: color-mix(in srgb, var(--identity-color) 65%, transparent);
    background: color-mix(in srgb, var(--identity-color) 11%, #101626);
  }
  .identity-choices img {
    width: 44px;
    height: 49px;
    border-radius: 5px;
    object-fit: cover;
  }
  .identity-choices strong {
    display: block;
    font-size: 13px;
    color: #e2e8f0;
    font-weight: 500;
  }
  .identity-choices small {
    display: block;
    font-size: 10px;
    color: #9ba8c6;
    margin-top: 7px;
  }
  .choice-arrow {
    color: var(--identity-color);
    font-size: 17px;
    margin-left: auto;
  }
  .identity-workspace {
    border: 1px solid color-mix(in srgb, var(--identity-color) 30%, transparent);
    background: #11182b;
    border-radius: 11px;
    overflow: hidden;
    box-shadow: 0 25px 60px #0003;
  }
  .demo-label {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 17px 25px;
    border-bottom: 1px solid #ffffff0d;
    font-size: 10px;
    color: #8d9bb8;
    background: #0c1324;
  }
  .demo-label > span:first-child {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #b8c4df;
  }
  .demo-label i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--identity-color);
  }
  .workspace-content {
    padding: 30px;
  }
  .identity-overview {
    display: flex;
    gap: 20px;
    align-items: center;
    animation: change 300ms ease both;
  }
  .identity-overview img {
    width: 78px;
    height: 88px;
    border-radius: 7px;
    object-fit: cover;
  }
  .identity-overview span {
    font-size: 10px;
    color: var(--identity-color);
  }
  .identity-overview h3 {
    font-size: 30px;
    font-weight: 500;
    letter-spacing: -0.8px;
    color: #e7eaf9;
    margin: 5px 0 7px;
  }
  .identity-overview code {
    font-size: 11px;
    color: #a7b3ce;
  }
  .workspace-content .identity-description {
    font-size: 12px;
    margin-top: 23px;
    min-height: 46px;
  }
  .identity-contact {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 20px;
    margin-top: 23px;
  }
  .identity-contact dt {
    font-size: 9px;
    color: #8391af;
    margin-bottom: 8px;
  }
  .identity-contact dd {
    font-size: 11px;
    color: #c4cde2;
    overflow-wrap: anywhere;
  }
  .workspace-views {
    display: flex;
    gap: 23px;
    padding-inline: 30px;
    border-bottom: 1px solid #ffffff10;
  }
  .workspace-views button {
    padding: 13px 0;
    border: 0;
    border-radius: 0;
    background: none;
    box-shadow: none;
    border-bottom: 2px solid transparent;
    color: #91a0bd;
    font-size: 11px;
  }
  .workspace-views button[aria-pressed='true'] {
    color: var(--identity-color);
    border-color: var(--identity-color);
  }
  .workspace-records {
    min-height: 235px;
    padding: 8px 30px 16px;
  }
  .record-list {
    animation: change 300ms ease both;
  }
  .record-row {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 17px 0;
    border-bottom: 1px solid #ffffff09;
  }
  .record-row:last-child {
    border-bottom: 0;
  }
  .record-symbol {
    display: grid;
    place-items: center;
    width: 33px;
    height: 35px;
    border: 1px solid #a5b4fc20;
    border-radius: 6px;
    color: var(--identity-color);
    font-size: 15px;
    flex-shrink: 0;
  }
  .record-row strong {
    display: block;
    color: #cfd8eb;
    font-size: 12px;
    font-weight: 500;
  }
  .record-row div > span {
    display: block;
    color: #8d9fbc;
    font-size: 10px;
    margin-top: 7px;
  }
  .saved-password {
    margin-left: auto;
    color: #8290ab;
    letter-spacing: 2px;
    font-size: 10px;
  }
  @keyframes change {
    from {
      opacity: 0.3;
      translate: 5px 0;
    }
    to {
      opacity: 1;
      translate: 0;
    }
  }
  @media (max-width: 950px) {
    .identity-demo {
      grid-template-columns: 225px 1fr;
      gap: 20px;
    }
    .identity-choices button {
      padding-inline: 12px;
      gap: 10px;
    }
    .choice-arrow {
      display: none;
    }
    .identities-heading {
      gap: 35px;
    }
  }
  @media (max-width: 700px) {
    .identities {
      padding-block: 65px;
    }
    .identities-heading {
      grid-template-columns: 1fr;
      gap: 25px;
      margin-bottom: 35px;
    }
    .identities-heading h2 {
      font-size: 36px;
    }
    .identity-demo {
      grid-template-columns: 1fr;
      gap: 15px;
    }
    .identity-choices {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
    }
    .identity-choices button {
      flex-direction: column;
      padding: 14px 5px;
      text-align: center;
      white-space: normal;
    }
    .identity-choices strong {
      font-size: 10px;
    }
    .identity-choices small {
      display: none;
    }
    .identity-choices img {
      width: 34px;
      height: 38px;
    }
    .workspace-content {
      padding: 23px 18px;
    }
    .demo-label {
      padding-inline: 18px;
      font-size: 9px;
    }
    .identity-overview {
      gap: 14px;
    }
    .identity-overview h3 {
      font-size: 24px;
    }
    .identity-overview img {
      width: 59px;
      height: 70px;
    }
    .identity-contact {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .workspace-views {
      padding-inline: 18px;
      gap: 24px;
    }
    .workspace-records {
      padding-inline: 18px;
    }
    .saved-password {
      letter-spacing: 0;
    }
  }
</style>
