<script lang="ts">
  import portrait from '$image/homepage/profile-pictures/theo-mercer.webp';
  import {HOMEPAGE_IDENTITY_EXAMPLES} from '$constant';
  import type {HomepageServiceId} from '$type';
  import ServiceIcon from './ServiceIcon.svelte';

  let {service}: {service: HomepageServiceId} = $props();
  const example = HOMEPAGE_IDENTITY_EXAMPLES[0];
</script>

<div class="service-visual" aria-label="Illustrative example">
  {#if service === 'identity'}
    <div class="identity-art">
      <div class="identity-echo" aria-hidden="true"></div>
      <div class="identity-pass">
        <div class="window-bar"><span class="emblem"><ServiceIcon service="identity" /></span><span>Example identity</span></div>
        <div class="person">
          <img src={portrait} alt={`Example profile for ${example.name}`} loading="lazy" />
          <div>
            <h4>{example.name}</h4>
            <code>@{example.handle}</code>
            <p>Photography &amp; design</p>
          </div>
        </div>
        <dl class="fields">
          <div>
            <dt>Location</dt>
            <dd>London, United Kingdom</dd>
          </div>
          <div>
            <dt>Biography</dt>
            <dd>Photographer. Design enthusiast.</dd>
          </div>
        </dl>
        <div class="record-footer"><span>Profile details</span><span>Saved together</span></div>
      </div>
      <div class="identity-orbit" aria-hidden="true"><span>TM</span><span>UK</span><span>01</span></div>
    </div>
  {:else if service === 'vault'}
    <div class="record vault-record">
      <div class="window-bar"><span>Account vault</span><span>Example record</span></div>
      <div class="vault-account">
        <span class="vault-mark">T</span>
        <div>
          <h4>Photography forum</h4>
          <small>{example.name}'s account</small>
        </div>
      </div>
      <dl class="fields">
        <div>
          <dt>Username</dt>
          <dd>{example.handle}</dd>
        </div>
        <div>
          <dt>Password</dt>
          <dd>••••••••••••••</dd>
        </div>
        <div>
          <dt>Two-factor code</dt>
          <dd class="totp">482 901 <span aria-hidden="true"></span></dd>
        </div>
      </dl>
      <div class="secret-note">Passwords and TOTP secrets encrypted in your browser</div>
    </div>
  {:else if service === 'email'}
    <div class="mail-art">
      <span class="floating-emblem"><ServiceIcon service="email" /></span>
      <div class="record">
        <div class="window-bar"><span>Theo's inbox</span><span>Example message</span></div>
        <div class="message">
          <code>To: {example.email}</code>
          <h4>Confirm your email address</h4>
          <p>Follow the link in this message to finish creating your account.</p>
          <span class="fake-link">Verification link</span>
        </div>
        <div class="record-footer">Delivered to your identity's inbox.</div>
      </div>
    </div>
  {:else if service === 'phone'}
    <div class="phone-art">
      <span class="floating-emblem"><ServiceIcon service="phone" /></span>
      <div class="phone-frame">
        <div class="phone-camera"></div>
        <div class="phone-top"><span>Messages</span><span>Example</span></div>
        <code class="phone-number">{example.phone}</code>
        <div class="sms-message">Your verification code is <strong>482 901</strong><small>Photography forum</small></div>
        <div class="sms-response">Received by this identity.</div>
        <div class="phone-home"></div>
      </div>
      <span class="phone-side">A number for the profile.<br />Messages in its workspace.</span>
    </div>
  {:else if service === 'wallet'}
    <div class="wallet-art">
      <div class="record">
        <div class="window-bar"><span>Theo's wallet</span><span>Example balance</span></div>
        <div class="wallet-balance"><span>Bitcoin</span><strong>0.0248 <small>BTC</small></strong><span>Receiving address</span><code>bc1q…7k4m</code></div>
        <div class="wallet-transaction">
          <span class="transaction-arrow" aria-hidden="true">↓</span>
          <div><strong>Received</strong><span>12 confirmations</span></div>
          <code>+0.0048 BTC</code>
        </div>
      </div>
      <div class="wallet-assets"><span>BTC</span><span>LTC</span><span>ETH</span><span>XMR</span><span>USDT</span></div>
    </div>
  {/if}
</div>

<style>
  .service-visual {
    position: relative;
    width: 100%;
    min-height: 360px;
    display: grid;
    place-items: center;
    isolation: isolate;
  }
  .service-visual::before {
    content: '';
    position: absolute;
    inset: 12%;
    background: radial-gradient(ellipse, color-mix(in srgb, var(--service-color) 17%, transparent), transparent 70%);
    filter: blur(25px);
    z-index: -1;
  }
  .record,
  .identity-pass {
    width: 100%;
    border: 1px solid color-mix(in srgb, var(--service-color) 35%, transparent);
    border-radius: 12px;
    background: #141925;
    overflow: hidden;
    box-shadow: 0 25px 60px #0005;
  }
  .identity-art,
  .wallet-art,
  .mail-art {
    width: 100%;
    max-width: 470px;
    position: relative;
  }
  .identity-pass {
    padding: 23px;
    background: linear-gradient(130deg, #232344ee, #101326);
    transform: rotate(-4deg);
  }
  .identity-echo {
    position: absolute;
    inset: -18px 15px 18px -15px;
    border: 1px solid #7c6cb03d;
    border-radius: 14px;
    transform: rotate(-9deg);
    background: #161a3166;
  }
  .window-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: #ffffff05;
    padding: 16px 20px;
    border-bottom: 1px solid #ffffff0d;
    font-size: 11px;
    color: #c1c4d9;
  }
  .window-bar > span:last-child {
    color: #9693a9;
    font-size: 10px;
  }
  .identity-pass .window-bar {
    padding: 0;
    background: none;
    justify-content: start;
    border: 0;
  }
  .emblem {
    display: block;
    width: 28px;
    height: 28px;
    color: var(--service-color);
  }
  .person {
    display: flex;
    gap: 19px;
    align-items: center;
    margin: 23px 0;
  }
  .person > img {
    width: 80px;
    height: 90px;
    object-fit: cover;
    object-position: 45% 25%;
    border-radius: 9px;
  }
  h4 {
    font-size: 18px;
    color: #e9e9f6;
    margin: 0 0 6px;
    font-weight: 500;
  }
  .person h4 {
    font-size: 23px;
  }
  code {
    font:
      11px 'Fira Code Variable',
      monospace;
    color: color-mix(in srgb, var(--service-color) 70%, #ddd);
  }
  .person p {
    font-size: 11px;
    margin-top: 8px;
  }
  .fields {
    margin: 0;
    padding: 0 23px;
  }
  .identity-pass .fields {
    padding: 0;
  }
  .fields > div,
  .record-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 10px;
    padding: 14px 0;
    border-top: 1px solid #b4a1ff1c;
    color: #c1c3d9;
  }
  dt {
    color: #9eabc0;
  }
  dd {
    margin: 0;
    text-align: right;
  }
  .record-footer {
    font-size: 10px;
    color: #9e98c5;
    padding: 15px 25px;
  }
  .identity-pass .record-footer {
    padding: 14px 0 0;
  }
  .identity-orbit {
    display: flex;
    position: absolute;
    right: -12px;
    bottom: -26px;
    gap: 8px;
    transform: rotate(4deg);
  }
  .identity-orbit span {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border: 1px solid #8a72d871;
    background: #282040;
    border-radius: 13px;
    color: #c4a9ff;
    font-size: 20px;
    box-shadow: 0 10px 20px #0004;
  }
  .vault-record {
    max-width: 470px;
  }
  .vault-account {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 23px;
  }
  .vault-mark {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid #fbbf2440;
    background: #fbbf2410;
    color: var(--service-color);
    border-radius: 9px;
  }
  .vault-account h4 {
    font-size: 15px;
  }
  small {
    color: #a8abc2;
    font-size: 10px;
  }
  .vault-record dd {
    color: #f5dfad;
    font-family: 'Fira Code Variable', monospace;
  }
  .totp {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .totp span {
    width: 14px;
    height: 14px;
    border: 2px solid #fbbf2433;
    border-top-color: var(--service-color);
    border-radius: 50%;
  }
  .secret-note {
    margin: 4px 23px 23px;
    padding: 12px;
    border: 1px solid #fbbf2426;
    background: #fbbf2408;
    border-radius: 6px;
    color: #d6bc80;
    font-size: 10px;
    line-height: 1.7;
  }
  .mail-art {
    padding-top: 48px;
  }
  .floating-emblem {
    position: absolute;
    width: 90px;
    height: 90px;
    right: 24px;
    top: -18px;
    transform: rotate(12deg);
    color: var(--service-color);
  }
  .message {
    padding: 24px 25px 20px;
  }
  .message h4 {
    margin: 20px 0 13px;
  }
  .message p {
    font-size: 12px;
  }
  .fake-link {
    display: inline-block;
    margin-top: 20px;
    padding: 10px 15px;
    background: #87354e;
    border: 1px solid #c1627b;
    border-radius: 5px;
    color: #ffe9ef;
    font-size: 11px;
  }
  .phone-art {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
    width: 100%;
  }
  .phone-art .floating-emblem {
    right: 12px;
    top: 10px;
    opacity: 0.75;
  }
  .phone-frame {
    position: relative;
    width: 215px;
    height: 363px;
    flex-shrink: 0;
    padding: 35px 16px 20px;
    border: 3px solid #334458;
    border-radius: 30px;
    background: linear-gradient(155deg, #192a40, #0d1627);
    box-shadow: 18px 24px 60px #0007;
    transform: rotate(-5deg);
  }
  .phone-camera {
    position: absolute;
    width: 45px;
    height: 5px;
    border-radius: 6px;
    background: #0b1320;
    top: 13px;
    left: calc(50% - 22px);
  }
  .phone-top {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #d9eaff;
  }
  .phone-top span:last-child {
    color: #8aabc7;
    font-size: 10px;
  }
  .phone-number {
    display: block;
    margin-top: 17px;
    color: #81b5d2;
    font-size: 10px;
    text-align: center;
  }
  .sms-message {
    font-size: 11px;
    line-height: 1.8;
    background: #213b57;
    border-radius: 13px 13px 13px 2px;
    padding: 17px 13px;
    margin-top: 30px;
    color: #cfeaff;
  }
  .sms-message strong {
    display: block;
    font:
      24px 'Fira Code Variable',
      monospace;
    color: #92dbfc;
    margin: 7px 0;
    letter-spacing: 1px;
  }
  .sms-response {
    border-radius: 12px 12px 2px 12px;
    background: #17536a;
    color: #c3f0fa;
    font-size: 10px;
    padding: 11px;
    margin: 17px 0 0 22px;
  }
  .phone-home {
    position: absolute;
    width: 65px;
    height: 3px;
    border-radius: 3px;
    background: #6e8198;
    bottom: 12px;
    left: calc(50% - 32px);
  }
  .phone-side {
    font-size: 11px;
    color: #90b9d2;
    line-height: 1.8;
    max-width: 140px;
  }
  .wallet-balance {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .wallet-balance > span {
    color: #9cb9ad;
    font-size: 11px;
  }
  .wallet-balance > strong {
    font:
      34px 'Fira Code Variable',
      monospace;
    color: #d1fae5;
    margin-bottom: 14px;
  }
  .wallet-balance small {
    font-size: 15px;
    color: var(--service-color);
  }
  .wallet-transaction {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 18px 24px;
    border-top: 1px solid #34d39920;
  }
  .transaction-arrow {
    color: var(--service-color);
    font-size: 23px;
  }
  .wallet-transaction div {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .wallet-transaction strong {
    font-size: 11px;
    font-weight: 500;
    color: #c3d9cf;
  }
  .wallet-transaction div > span {
    font-size: 10px;
    color: #8da89c;
  }
  .wallet-transaction code {
    margin-left: auto;
    font-size: 11px;
  }
  .wallet-assets {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 25px;
  }
  .wallet-assets span {
    border-radius: 50%;
    border: 1px solid #518165;
    background: #13261f;
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    color: #96d2ad;
    font:
      10px 'Fira Code Variable',
      monospace;
  }
  @media (max-width: 600px) {
    .identity-pass {
      padding: 19px;
    }
    .identity-art {
      width: 90%;
    }
    .person {
      gap: 12px;
    }
    .person > img {
      width: 65px;
      height: 80px;
    }
    .person h4 {
      font-size: 20px;
    }
    .phone-art {
      gap: 14px;
    }
    .phone-side {
      max-width: 100px;
      font-size: 10px;
    }
    .phone-frame {
      width: 195px;
    }
    .phone-art .floating-emblem {
      width: 70px;
      height: 70px;
    }
  }
  @media (max-width: 380px) {
    .phone-side {
      display: none;
    }
    .person h4 {
      font-size: 17px;
    }
    .fields > div {
      flex-wrap: wrap;
    }
    .wallet-assets {
      gap: 8px;
    }
    .wallet-transaction {
      padding-inline: 16px;
    }
  }
</style>
