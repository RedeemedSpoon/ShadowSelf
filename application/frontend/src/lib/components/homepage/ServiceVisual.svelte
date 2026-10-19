<script lang="ts">
  import portrait from '$image/homepage/profile-pictures/theo-mercer.webp';
  import {HOMEPAGE_EXAMPLE_IDENTITY} from '$constant';
  import type {HomepageServiceId} from '$type';
  import ServiceIcon from './ServiceIcon.svelte';
  import AssetIcon from './AssetIcon.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import map from '$image/patterns/world-map.svg';

  let {service}: {service: HomepageServiceId} = $props();
  const example = HOMEPAGE_EXAMPLE_IDENTITY;
</script>

<div class="service-visual" aria-label="Illustrative example">
  {#if service === 'identity'}
    <div class="identity-art">
      <div class="identity-echo" aria-hidden="true"></div>
      <div class="identity-pass">
        <div class="window-bar">
          <span class="emblem"><ServiceIcon service="identity" /></span><span>Example identity</span>
        </div>
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
    <div class="vault-art">
      <div class="vault-ring" aria-hidden="true"><Icon name="key" size={48} /></div>
      <div class="vault-record credential-sheet">
        <div class="vault-account">
          <span class="vault-mark"><Icon name="lock" /></span>
          <div>
            <h4>Photography forum</h4>
            <small>{example.handle}</small>
          </div>
        </div>
        <dl class="fields">
          <div>
            <dt>Password</dt>
            <dd>••••••••••••</dd>
          </div>
          <div>
            <dt>Two-factor code</dt>
            <dd class="totp">482 901 <span aria-hidden="true"></span></dd>
          </div>
        </dl>
        <div class="secret-note"><Icon name="shield" size={16} /> Encrypted in your browser</div>
      </div>
      <div class="recovery-slip">
        <Icon name="key" size={18} /><span>Recovery codes<br /><small>8 codes saved</small></span><code
          >•••• − ••••</code>
      </div>
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
        <div class="sms-message">
          Your verification code is <strong>482 901</strong><small>Photography forum</small>
        </div>
        <div class="sms-response">Received by this identity.</div>
        <div class="phone-home"></div>
      </div>
      <span class="phone-side">A number for the profile.<br />Messages in its workspace.</span>
    </div>
  {:else if service === 'wallet'}
    <div class="crypto-art">
      <div class="crypto-orbit" aria-hidden="true"></div>
      <div class="crypto-balance">
        <span>Bitcoin wallet</span><strong>0.0248 <small>BTC</small></strong><code>bc1q…7k4m</code>
      </div>
      <div class="crypto-coins">
        {#each ['BTC', 'LTC', 'ETH', 'XMR', 'USDT'] as asset, index (asset)}
          <div class="crypto-coin" style:--coin-index={index} aria-label={asset}>
            <AssetIcon asset={asset as 'BTC' | 'LTC' | 'ETH' | 'XMR' | 'USDT'} />
          </div>
        {/each}
      </div>
      <div class="crypto-receipt">
        <Icon name="download" size={18} /><span>Received <small>12 confirmations</small></span><code>+0.0048 BTC</code>
      </div>
    </div>
  {:else if service === 'card'}
    <div class="payment-art">
      <div class="payment-card">
        <div><span>ShadowSelf</span><small>Virtual card</small></div>
        <span class="card-chip" aria-hidden="true"></span>
        <code>•••• &nbsp; •••• &nbsp; •••• &nbsp; 0042</code>
        <div><span>{example.name}</span><span class="card-circles" aria-hidden="true"></span></div>
      </div>
      <div class="payment-receipt">
        <Icon name="card" size={18} /><span>Monthly limit <strong>$250.00</strong></span><small>$42.00 spent</small>
      </div>
    </div>
  {:else if service === 'proxy'}
    <div class="proxy-art">
      <img class="world-map" src={map} alt="" />
      <svg class="proxy-route" viewBox="0 0 500 300" fill="none" aria-hidden="true">
        <path d="M80 190Q245 -15 415 135" /><path class="route-packet" d="M80 190Q245 -15 415 135" pathLength="100" />
        <circle cx="80" cy="190" r="6" /><circle cx="415" cy="135" r="6" />
      </svg>
      <span class="route-origin">Your device</span><span class="route-destination">Residential exit</span>
      <div class="proxy-ticket">
        <Icon name="shield" size={22} /><span>United Kingdom <code>203.0.113.42</code></span><i aria-hidden="true"></i>
      </div>
    </div>
  {:else if service === 'cloud'}
    <div class="drive-art">
      <div class="drive-folder"><span>Identity files</span><Icon name="lock" size={16} /></div>
      <div class="drive-files">
        <div class="drive-file image-file">
          <img src={portrait} alt="Theo Mercer" loading="lazy" /><span>profile.jpg</span>
        </div>
        <div class="drive-file pdf-file">
          <span class="file-format">PDF</span><i></i><i></i><i></i><span>notes.pdf</span>
        </div>
        <div class="drive-file video-file"><Icon name="play" size={30} /><span>intro.mp4</span></div>
      </div>
      <div class="drive-caption">
        <Icon name="shield" size={16} /><span>Image metadata removed. Ready to share.</span>
      </div>
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
  .credential-sheet,
  .identity-pass {
    width: 100%;
    border: 1px solid color-mix(in srgb, var(--service-color) 35%, transparent);
    border-radius: 12px;
    background: #141925;
    overflow: hidden;
    box-shadow: 0 25px 60px #0005;
  }
  .identity-art,
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
    isolation: isolate;
  }
  .mail-art .record {
    position: relative;
    z-index: 1;
  }
  .mail-art .floating-emblem {
    z-index: 0;
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
  }
  .vault-art,
  .crypto-art,
  .payment-art,
  .proxy-art,
  .drive-art {
    width: 100%;
    max-width: 470px;
    position: relative;
  }
  .vault-art {
    padding: 40px 14px 30px;
  }
  .vault-ring {
    position: absolute;
    top: 0;
    right: 28px;
    color: #fbbf24;
    transform: rotate(25deg);
  }
  .credential-sheet {
    position: relative;
    transform: rotate(-4deg);
    z-index: 1;
  }
  .secret-note {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .recovery-slip {
    position: relative;
    z-index: 2;
    margin: -10px 0 0 30px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid #fbbf2440;
    border-radius: 8px;
    background: #29251b;
    color: #fbbf24;
    transform: rotate(3deg);
    font-size: 11px;
  }
  .recovery-slip code {
    margin-left: auto;
  }
  .crypto-art {
    height: 350px;
    display: grid;
    place-items: center;
  }
  .crypto-orbit {
    position: absolute;
    width: 290px;
    height: 290px;
    border: 1px dashed #34d39940;
    border-radius: 50%;
    transform: rotateX(40deg);
  }
  .crypto-balance {
    text-align: center;
    padding-bottom: 10px;
  }
  .crypto-balance > span {
    display: block;
    color: #8dc9b1;
    font-size: 12px;
    margin-bottom: 15px;
  }
  .crypto-balance strong {
    display: block;
    color: #d1fae5;
    font:
      30px 'Fira Code Variable',
      monospace;
    margin-bottom: 15px;
  }
  .crypto-balance small {
    color: #34d399;
    font-size: 14px;
  }
  .crypto-coins {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .crypto-coin {
    position: absolute;
    width: 45px;
    height: 45px;
    padding: 8px;
    border-radius: 50%;
    background: #142822;
    border: 1px solid #34d39960;
    box-shadow:
      0 5px 0 #0b1914,
      0 12px 20px #0004;
    color: #34d399;
  }
  .crypto-coin:nth-child(1) {
    left: 10%;
    top: 12%;
    color: #f7931a;
    transform: rotate(-15deg);
  }
  .crypto-coin:nth-child(2) {
    right: 14%;
    top: 6%;
    color: #bfc6d4;
  }
  .crypto-coin:nth-child(3) {
    right: 2%;
    top: 45%;
    color: #a5b4fc;
    transform: rotate(12deg);
  }
  .crypto-coin:nth-child(4) {
    left: 3%;
    top: 48%;
    color: #ff6600;
  }
  .crypto-coin:nth-child(5) {
    left: 46%;
    bottom: 16%;
    color: #26a17b;
  }
  .crypto-receipt {
    position: absolute;
    bottom: 0;
    display: flex;
    gap: 12px;
    align-items: center;
    background: #101e21;
    border-radius: 8px;
    padding: 12px 16px;
    border: 1px solid #34d39930;
    color: #34d399;
    font-size: 11px;
  }
  .crypto-receipt small {
    display: block;
    margin-top: 4px;
  }
  .payment-art {
    padding: 35px 10px;
  }
  .payment-card {
    padding: 26px;
    border: 1px solid #e879f960;
    border-radius: 16px;
    background:
      radial-gradient(ellipse at 80% 10%, #e879f925, transparent 65%), linear-gradient(140deg, #392544, #161525);
    box-shadow: 0 24px 45px #0005;
    transform: rotate(-7deg);
  }
  .payment-card > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: #f5d0fe;
  }
  .payment-card > code {
    display: block;
    margin: 20px 0 28px;
    font-size: clamp(13px, 1.5vw, 20px);
    letter-spacing: 2px;
    color: #f8e3fc;
  }
  .card-chip {
    display: block;
    width: 38px;
    height: 30px;
    margin-top: 28px;
    border: 1px solid #d0b67b;
    border-radius: 6px;
    background: repeating-linear-gradient(90deg, #c4aa75 0 10px, #76684c 11px 12px);
  }
  .card-circles {
    width: 36px;
    height: 22px;
    background:
      radial-gradient(circle at 11px 11px, #e879f980 0 10px, transparent 11px),
      radial-gradient(circle at 25px 11px, #a78bfa80 0 10px, transparent 11px);
  }
  .payment-receipt {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    margin: -5px 0 0 45px;
    padding: 16px;
    background: #181b2c;
    border: 1px solid #e879f930;
    border-radius: 8px;
    transform: rotate(3deg);
    color: #e879f9;
    font-size: 11px;
  }
  .payment-receipt strong {
    display: block;
    margin-top: 5px;
    color: #f5d0fe;
  }
  .payment-receipt small {
    margin-left: auto;
  }
  .proxy-art {
    height: 350px;
  }
  .world-map {
    position: absolute;
    width: 100%;
    height: 300px;
    object-fit: contain;
    opacity: 0.55;
  }
  .proxy-route {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 300px;
    color: #a3e635;
  }
  .proxy-route path {
    stroke: currentColor;
    stroke-width: 1.5;
    opacity: 0.35;
  }
  .proxy-route .route-packet {
    stroke-width: 3;
    stroke-dasharray: 8 92;
    opacity: 1;
    animation: route-travel 6s linear infinite;
  }
  .proxy-route circle {
    fill: #a3e635;
    stroke: #a3e63540;
    stroke-width: 12;
  }
  .route-origin,
  .route-destination {
    position: absolute;
    top: 63%;
    left: 10%;
    color: #a3e635;
    font-size: 10px;
  }
  .route-destination {
    left: auto;
    right: 0;
    top: 44%;
  }
  .proxy-ticket {
    position: absolute;
    bottom: 0;
    left: 15%;
    right: 5%;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px;
    border: 1px solid #a3e63535;
    background: #17211c;
    border-radius: 8px;
    color: #a3e635;
    font-size: 11px;
  }
  .proxy-ticket code {
    display: block;
    margin-top: 6px;
  }
  .proxy-ticket i {
    width: 6px;
    height: 6px;
    background: #a3e635;
    border-radius: 50%;
    margin-left: auto;
    box-shadow: 0 0 12px #a3e63570;
  }
  .drive-art {
    padding: 55px 12px 25px;
  }
  .drive-folder {
    height: 210px;
    position: relative;
    border-radius: 0 12px 12px 12px;
    background: linear-gradient(145deg, #67452c, #382a24);
    border: 1px solid #fb923c60;
    padding: 25px;
    display: flex;
    justify-content: space-between;
    color: #fed7aa;
    font-size: 12px;
  }
  .drive-folder::before {
    content: '';
    position: absolute;
    top: -23px;
    left: -1px;
    width: 45%;
    height: 24px;
    border: 1px solid #fb923c60;
    border-bottom: 0;
    border-radius: 9px 15px 0 0;
    background: #67452c;
  }
  .drive-files {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    position: relative;
    margin-top: -145px;
    padding-inline: 10px;
  }
  .drive-file {
    width: 31%;
    height: 145px;
    border-radius: 7px;
    border: 1px solid #d5b19650;
    background: #182031;
    box-shadow: 0 15px 25px #0005;
    overflow: hidden;
    position: relative;
  }
  .drive-file > span:last-child {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    padding: 10px 4px;
    background: #111827;
    color: #d6ddec;
    font-size: 9px;
  }
  .image-file {
    transform: rotate(-9deg);
  }
  .image-file img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .pdf-file {
    background: #e7e4dc;
    transform: translateY(-15px);
    padding: 17px;
  }
  .file-format {
    color: #b43f47;
    font-size: 18px;
    font-weight: 650;
  }
  .pdf-file i {
    display: block;
    height: 3px;
    margin-top: 10px;
    background: #a5a5ab;
  }
  .pdf-file i:last-of-type {
    width: 65%;
  }
  .video-file {
    display: grid;
    place-items: center;
    background: linear-gradient(140deg, #38405f, #1b2236);
    color: #c4b5fd;
    transform: rotate(9deg);
  }
  .drive-caption {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 35px;
    color: #fdba74;
    font-size: 10px;
  }
  @keyframes route-travel {
    to {
      stroke-dashoffset: -100;
    }
  }
  @media (max-width: 380px) {
    .crypto-balance strong {
      font-size: 25px;
    }
    .recovery-slip {
      margin-left: 0;
    }
    .payment-card {
      padding: 20px;
    }
    .payment-receipt {
      margin-left: 15px;
    }
    .proxy-ticket {
      left: 5%;
    }
  }
</style>
