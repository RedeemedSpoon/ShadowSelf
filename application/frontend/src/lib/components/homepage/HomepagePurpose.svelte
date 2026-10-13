<script lang="ts">
  import {HOMEPAGE_SERVICES, HOMEPAGE_IDENTITY_EXAMPLES} from '$constant';
  import logo from '$image/brands/shadowself/icon.svg';
</script>

<section class="purpose" id="why-shadowself">
  <div class="chapter-width purpose-layout">
    <div class="purpose-copy" data-reveal>
      <h2>Keep your identities separate.<br /><span>Bring the work together.</span></h2>
      <p>
        A separate identity needs more than a name. It needs an inbox, contact details, and access to the accounts you create. ShadowSelf organizes those
        records around the profile they belong to.
      </p>
      <p class="purpose-answer">Select an identity to open its messages, credentials, and wallets in one workspace.</p>
    </div>
    <div class="assembly" data-reveal aria-label="Identity tools organized under one profile">
      <div class="assembly-tools">
        {#each HOMEPAGE_SERVICES as service, index (service.id)}
          <div style:--tool-color={service.color} style:--delay={`${index * -0.7}s`}><i></i><span>{service.name}</span><b aria-hidden="true">→</b></div>
        {/each}
      </div>
      <div class="assembly-spine" aria-hidden="true"><span></span></div>
      <div class="assembly-profile">
        <div class="assembly-record">
          <img src={logo} alt="" />
          <span>One identity workspace</span>
          <strong>{HOMEPAGE_IDENTITY_EXAMPLES[0].name}</strong>
          <div><span>Profile</span><span>Accounts</span><span>Tools</span></div>
        </div>
        <p class="assembly-caption">Choose the identity first.<br />Its tools are already together.</p>
      </div>
    </div>
  </div>
  <div class="purpose-benefits chapter-width" data-reveal>
    <article>
      <svg viewBox="0 0 64 48" fill="none" aria-hidden="true"
        ><path d="M7 30V7h34M13 35V13h34" stroke="currentColor" stroke-opacity=".35" /><rect
          x="19"
          y="19"
          width="38"
          height="24"
          rx="3"
          stroke="currentColor"
          stroke-width="1.5" /><path d="M19 26h38M25 32h10m-10 5h19" stroke="currentColor" /><circle cx="23" cy="23" r="1" fill="currentColor" /></svg>
      <h3>Fewer services to juggle.</h3>
      <p>Open the identity to reach its inbox, number, vault, and wallet.</p>
    </article>
    <article>
      <svg viewBox="0 0 64 48" fill="none" aria-hidden="true"
        ><rect x="5" y="7" width="22" height="32" rx="3" stroke="currentColor" stroke-opacity=".4" /><rect
          x="37"
          y="7"
          width="22"
          height="32"
          rx="3"
          stroke="currentColor"
          stroke-width="1.5" /><path
          d="M11 14h10m-10 6h7M43 14h10m-10 6h7M19 29h26m-6-5 6 5-6 5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round" /></svg>
      <h3>Less copying by hand.</h3>
      <p>Keep contact details beside the accounts that use them.</p>
    </article>
    <article>
      <svg viewBox="0 0 64 48" fill="none" aria-hidden="true"
        ><rect x="5" y="7" width="54" height="34" rx="4" stroke="currentColor" stroke-width="1.5" /><circle cx="20" cy="20" r="5" stroke="currentColor" /><path
          d="M11 33c0-10 18-10 18 0m8-18h14m-14 7h10m-10 7h14"
          stroke="currentColor"
          stroke-linecap="round" /><path d="m49 39 4 4 7-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
      <h3>Know which identity you're using.</h3>
      <p>See the profile before you reach for its tools.</p>
    </article>
  </div>
</section>

<style>
  .purpose {
    padding-block: 110px 55px;
    background: radial-gradient(ellipse at 80% 35%, #4f46e510, transparent 60%), #090f20;
  }
  .purpose-layout {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 85px;
    align-items: center;
  }
  .purpose-copy h2 {
    font-size: clamp(36px, 3.5vw, 49px);
    letter-spacing: -1.9px;
    margin-bottom: 32px;
  }
  .purpose-copy h2 span {
    color: var(--color-indigo-300);
  }
  .purpose-copy p {
    font-size: 14px;
    margin-top: 20px;
  }
  .purpose-copy .purpose-answer {
    color: #d0d7ee;
    padding-left: 20px;
    border-left: 2px solid #818cf870;
  }
  .assembly {
    display: grid;
    grid-template-columns: 1fr 45px 1.1fr;
    align-items: center;
    position: relative;
  }
  .assembly-tools {
    display: grid;
    gap: 12px;
  }
  .assembly-tools > div {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 12px;
    background: #11182b;
    border-bottom: 1px solid color-mix(in srgb, var(--tool-color) 25%, transparent);
    border-radius: 5px 0 0 5px;
  }
  .assembly-tools i {
    width: 5px;
    height: 5px;
    background: var(--tool-color);
    border-radius: 50%;
    box-shadow: 0 0 9px color-mix(in srgb, var(--tool-color) 50%, transparent);
  }
  .assembly-tools span {
    font-size: 11px;
    color: #bcc5de;
  }
  .assembly-tools b {
    margin-left: auto;
    color: var(--tool-color);
    font-size: 12px;
    font-weight: 400;
    animation: signal 5.6s var(--delay) ease infinite;
  }
  .assembly-spine {
    border: 1px solid #818cf84d;
    border-left: 0;
    height: calc(100% - 68px);
    margin-right: 22px;
    position: relative;
  }
  .assembly-spine::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    height: 1px;
    width: 23px;
    background: #818cf880;
  }
  .assembly-spine span {
    position: absolute;
    width: 3px;
    height: 35px;
    right: -2px;
    background: linear-gradient(transparent, #a5b4fc, transparent);
    animation: collect 6s linear infinite;
  }
  .assembly-profile {
    position: relative;
  }
  .assembly-record {
    padding: 25px 18px;
    border: 1px solid #818cf85e;
    background: linear-gradient(150deg, #24264a, #12192e);
    border-radius: 9px;
    box-shadow: 0 25px 50px #0004;
  }
  .assembly-record img {
    width: 39px;
    height: 39px;
    margin-bottom: 26px;
  }
  .assembly-record > span {
    display: block;
    color: #a3accd;
    font-size: 9px;
    margin-bottom: 10px;
  }
  .assembly-record strong {
    display: block;
    color: #e0e7ff;
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.5px;
  }
  .assembly-record > div {
    display: grid;
    gap: 10px;
    border-top: 1px solid #a5b4fc25;
    margin-top: 24px;
    padding-top: 17px;
    font-size: 10px;
    color: #acb9dd;
  }
  .assembly-caption {
    position: absolute;
    top: calc(100% + 16px);
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 10px;
    line-height: 1.7;
  }
  .purpose-benefits {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 38px;
    margin-top: 80px;
    padding-block: 35px 15px;
    border-top: 1px solid #a5b4fc26;
  }
  .purpose-benefits article {
    color: var(--color-indigo-300);
  }
  .purpose-benefits article:nth-child(2) {
    color: var(--color-rose-300);
  }
  .purpose-benefits article:nth-child(3) {
    color: var(--color-amber-300);
  }
  .purpose-benefits svg {
    width: 64px;
    height: 48px;
    margin-bottom: 20px;
  }
  .purpose-benefits h3 {
    font-size: 20px;
    line-height: 1.4;
    font-weight: 500;
    letter-spacing: -0.4px;
    margin-bottom: 13px;
  }
  .purpose-benefits p {
    font-size: 13px;
    line-height: 1.8;
    max-width: 280px;
  }

  @keyframes signal {
    0%,
    75%,
    100% {
      opacity: 0.35;
      translate: 0;
    }
    85% {
      opacity: 1;
      translate: 4px;
    }
  }
  @keyframes collect {
    from {
      top: 0;
    }
    to {
      top: calc(100% - 35px);
    }
  }
  @media (max-width: 1000px) {
    .purpose-layout {
      gap: 40px;
    }
    .assembly {
      grid-template-columns: 1fr 25px 1fr;
    }
    .assembly-spine {
      margin-right: 12px;
    }
    .assembly-spine::after {
      width: 13px;
    }
    .assembly-record {
      padding-inline: 12px;
    }
  }
  @media (max-width: 750px) {
    .purpose {
      padding-block: 65px 35px;
    }
    .purpose-layout {
      grid-template-columns: 1fr;
      gap: 45px;
    }
    .purpose-copy h2 {
      font-size: 36px;
      letter-spacing: -1.5px;
    }
    .assembly {
      max-width: 470px;
      width: 100%;
      margin: 0 auto 30px;
      grid-template-columns: 1fr 35px 1.1fr;
    }
    .assembly-spine {
      margin-right: 17px;
    }
    .assembly-spine::after {
      width: 18px;
    }
    .purpose-benefits {
      margin-top: 50px;
      grid-template-columns: 1fr;
      gap: 28px;
    }
    .purpose-benefits article {
      display: grid;
      grid-template-columns: 54px 1fr;
      column-gap: 18px;
    }
    .purpose-benefits svg {
      grid-row: span 2;
      width: 54px;
      height: 44px;
      margin: 0;
    }
    .purpose-benefits h3 {
      font-size: 19px;
      margin-bottom: 8px;
    }
    .purpose-benefits p {
      max-width: none;
    }
    .assembly-record strong {
      font-size: 18px;
    }
  }
</style>
