<script lang="ts">
  import {HOMEPAGE_CHAIN_LINK_PATH} from '$constant';
  import Icon from '$component/ui/Icon.svelte';
</script>

<section class="privacy" id="privacy">
  <div class="chapter-width">
    <div class="privacy-layout" data-reveal>
      <div
        class="privacy-illustration"
        aria-label="Your browser holds the key to passwords, TOTP, and wallet secrets. Only encrypted values are stored.">
        <div class="browser-frame">
          <div class="browser-title"><span><i></i><i></i><i></i></span><small>Your browser</small></div>
          <div class="key-chamber">
            <div class="key-halo"><Icon name="key" size={43} /></div>
            <strong>You hold the key.</strong><span>Master password stays here</span>
          </div>
          <svg class="secret-chains" viewBox="0 0 360 100" preserveAspectRatio="none" fill="none" aria-hidden="true">
            <defs
              ><clipPath id="homepage-chain-separator"><rect x="0" y="10" width="360" height="100" /></clipPath></defs>
            <g clip-path="url(#homepage-chain-separator)">
              {#each [60, 180, 300] as target (target)}
                {@const count = target === 180 ? 3 : 4}
                {@const origin = target === 60 ? 152 : target === 300 ? 208 : 180}
                {#each Array.from({length: count}, (_, index) => index) as index (index)}
                  {@const progress = (index + 0.5) / count}
                  {@const x = origin + (target - origin) * progress}
                  {@const y = 100 * progress}
                  <path
                    d={HOMEPAGE_CHAIN_LINK_PATH}
                    transform={`translate(${x} ${y}) rotate(${(Math.atan2(100, target - origin) * 180) / Math.PI + 45}) scale(1.35) translate(-12 -12)`} />
                {/each}
              {/each}
            </g>
            <path class="chain-anchor" d="M120 10H240" />
          </svg>
          <div class="secret-boxes">
            <div><Icon name="key" size={19} /><span>Passwords</span><code>••••••••</code></div>
            <div><Icon name="shield" size={19} /><span>TOTP</span><code>••••••</code></div>
            <div><Icon name="wallet" size={19} /><span>Wallet secrets</span><code>••••••••</code></div>
          </div>
          <svg class="storage-chains" viewBox="0 0 360 32" preserveAspectRatio="none" fill="none" aria-hidden="true">
            {#each [60, 180, 300] as x (x)}
              <path d={HOMEPAGE_CHAIN_LINK_PATH} transform={`translate(${x} 16) rotate(135) translate(-12 -12)`} />
            {/each}
          </svg>
          <div class="cipher-storage">
            <Icon name="cloud" size={24} />
            <div><span>Stored by ShadowSelf</span><code>8f2c…a91b &nbsp; 4e7d…b023</code></div>
            <Icon name="lock" size={17} />
          </div>
        </div>
        <p class="illustration-caption">Encrypted before it leaves your device.</p>
      </div>
      <div class="privacy-copy">
        <span class="privacy-eyebrow">Zero-knowledge vault. Open-source code.</span>
        <h2>Your secrets<br />stay yours.</h2>
        <p>
          Your browser encrypts vault passwords, TOTP secrets, and wallet recovery material before storage. Your
          identity's master password never leaves the browser. ShadowSelf stores the encrypted values without the key to
          read them.
        </p>
        <div class="privacy-links">
          <a class="inline-link" href="https://github.com/RedeemedSpoon/ShadowSelf"
            >Inspect the source <Icon name="external" size={13} /></a
          ><a class="inline-link" href="/privacy-policy">Read the privacy policy <Icon name="arrow" size={13} /></a>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .privacy {
    padding-block: 110px;
    background: radial-gradient(ellipse at 20% 45%, #4338ca10, transparent 55%), #0b1020;
  }
  .privacy-layout {
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    gap: 90px;
    align-items: center;
  }
  .privacy-illustration {
    max-width: 460px;
    width: 100%;
    margin: auto;
    padding: 15px;
  }
  .browser-frame {
    border: 1px solid color-mix(in srgb, var(--accent) 29.02%, transparent);
    border-radius: 10px;
    background: linear-gradient(150deg, #1a2340, #0e1729);
    box-shadow: 0 22px 60px #0004;
    overflow: hidden;
  }
  .browser-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 13.33%, transparent);
    padding: 13px 16px;
  }
  .browser-title > span {
    display: flex;
    gap: 5px;
  }
  .browser-title i {
    height: 8px;
    width: 8px;
    background: #ff5f57;
    border-radius: 50%;
  }
  .browser-title i:nth-child(2) {
    background: #febc2e;
  }
  .browser-title i:nth-child(3) {
    background: #28c840;
  }
  .browser-title small {
    color: #94a3b8;
    font-size: 10px;
  }
  .key-chamber {
    display: grid;
    justify-items: center;
    gap: 10px;
    padding: 28px 15px 0;
  }
  .key-halo {
    display: grid;
    place-items: center;
    width: 82px;
    height: 82px;
    margin-bottom: 6px;
    color: var(--accent-light);
    border: 1px solid color-mix(in srgb, var(--accent) 23.92%, transparent);
    outline: 1px dashed color-mix(in srgb, var(--accent) 14.51%, transparent);
    outline-offset: 9px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--accent-strong) 14.51%, transparent),
      color-mix(in srgb, var(--accent-strong) 1.96%, transparent)
    );
  }
  .key-chamber strong {
    font-size: 17px;
    color: #dbe4ff;
    font-weight: 500;
  }
  .key-chamber > span {
    font-size: 9px;
    color: #8698bd;
  }
  .privacy-illustration :global(svg[data-icon]) {
    color: var(--accent-light);
  }
  .secret-chains,
  .storage-chains {
    display: block;
    width: calc(100% - 32px);
    margin-inline: 16px;
    stroke: var(--accent-light);
    stroke-width: 1.6;
  }
  .secret-chains {
    height: 94px;
    margin-top: 22px;
    overflow: visible;
  }
  .chain-anchor {
    stroke-opacity: 0.8;
    stroke-width: 1.5;
  }
  .secret-chains path,
  .storage-chains path {
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .storage-chains {
    height: 30px;
  }
  .secret-boxes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
    margin-inline: 16px;
  }
  .secret-boxes > div {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 10px;
    padding: 14px 4px;
    border: 1px solid color-mix(in srgb, var(--accent) 29.02%, transparent);
    border-radius: 6px;
    background: #111b31;
    color: var(--accent-light);
  }
  .secret-boxes span {
    font-size: 10px;
    color: #c3cfe8;
    text-align: center;
  }
  .secret-boxes code {
    font-size: 9px;
    color: #6e80a9;
  }
  .cipher-storage {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    margin: 0 16px 16px;
    border: 1px solid #64748b40;
    border-radius: 7px;
    background: #0d1729;
    color: #8a9cc0;
  }
  .cipher-storage > div {
    flex: 1;
  }
  .cipher-storage span {
    display: block;
    color: #a9b8d3;
    font-size: 10px;
  }
  .cipher-storage code {
    display: block;
    color: #6e81a9;
    font-size: 9px;
    margin-top: 8px;
  }
  .privacy-illustration .illustration-caption {
    margin-top: 18px;
    text-align: center;
    font-size: 10px;
    color: #7384a5;
  }
  .privacy-eyebrow {
    display: block;
    color: var(--accent);
    font-size: 12px;
    margin-bottom: 22px;
  }
  .privacy-copy h2 {
    font-size: clamp(40px, 4vw, 58px);
    letter-spacing: -2px;
    margin-bottom: 27px;
  }
  .privacy-copy > p {
    font-size: 14px;
  }
  .privacy-links {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 30px;
    margin-top: 32px;
  }
  .privacy-links a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  @media (max-width: 900px) {
    .privacy-layout {
      gap: 35px;
    }
    .privacy-illustration {
      padding: 0;
    }
  }
  @media (max-width: 650px) {
    .privacy {
      padding-block: 65px;
    }
    .privacy-layout {
      grid-template-columns: 1fr;
      gap: 40px;
    }
    .privacy-copy {
      grid-row: 1;
    }
    .privacy-copy h2 {
      font-size: 43px;
    }
    .privacy-illustration {
      max-width: 370px;
    }
    .privacy-links {
      justify-content: flex-start;
      gap: 24px;
    }
  }
  @media (max-width: 380px) {
    .secret-boxes {
      gap: 6px;
      margin-inline: 10px;
    }
    .secret-boxes span {
      font-size: 9px;
    }
    .privacy-illustration :global(svg[data-icon]) {
      color: var(--accent-light);
    }
    .secret-chains,
    .storage-chains {
      display: block;
      width: calc(100% - 32px);
      margin-inline: 16px;
      stroke: var(--accent-light);
      stroke-width: 1.6;
    }
    .secret-chains {
      width: calc(100% - 20px);
      margin-inline: 10px;
    }
    .cipher-storage {
      margin-inline: 10px;
      padding: 12px;
    }
  }
</style>
