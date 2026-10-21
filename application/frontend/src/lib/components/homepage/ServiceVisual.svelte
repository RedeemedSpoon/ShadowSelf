<script lang="ts">
  import portrait from '$image/homepage/profile-pictures/yuna-choi.webp';
  import {HOMEPAGE_PANEL_IDENTITIES} from '$constant';
  import type {HomepageServiceId} from '$type';
  import ServiceIcon from './ServiceIcon.svelte';
  import BlockchainVisual from './BlockchainVisual.svelte';
  import DriveVisual from './DriveVisual.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import map from '$image/patterns/world-map.svg';

  let {service}: {service: HomepageServiceId} = $props();
  const examples = HOMEPAGE_PANEL_IDENTITIES;
  let codeCycle = $state(0);
  const demoCode = $derived(String((482901 + codeCycle * 193207) % 1000000).padStart(6, '0'));
</script>

<div class="service-visual" data-service={service} aria-label="Illustrative example">
  {#if service === 'identity'}
    <div class="identity-art">
      <div class="identity-echo" aria-hidden="true"></div>
      <div class="identity-pass">
        <div class="window-bar">
          <span class="emblem"><ServiceIcon /></span><span>Example identity</span>
        </div>
        <div class="person">
          <div class="portrait-scan">
            <img src={portrait} alt={`Example profile for ${examples.identity.name}`} loading="lazy" /><span
              aria-hidden="true"></span>
          </div>
          <div>
            <h4>{examples.identity.name}</h4>
            <code>@{examples.identity.handle}</code>
            <p>Film photography</p>
          </div>
        </div>
        <dl class="fields">
          <div>
            <dt>Location</dt>
            <dd>{examples.identity.location}</dd>
          </div>
          <div>
            <dt>Biography</dt>
            <dd>Film, sea air, and long walks.</dd>
          </div>
        </dl>
        <div class="record-footer"><span>Profile details</span><span>Saved together</span></div>
      </div>
      <div class="identity-orbit" aria-hidden="true">
        <span>{examples.identity.initials}</span><span>{examples.identity.countryCode}</span><span>01</span>
      </div>
    </div>
  {:else if service === 'vault'}
    <div class="vault-art">
      <div class="vault-record credential-sheet">
        <div class="vault-account">
          <span class="vault-mark"><Icon name="lock" /></span>
          <div>
            <h4>Hiking journal</h4>
            <small>{examples.vault.handle}</small>
          </div>
        </div>
        <dl class="fields">
          <div>
            <dt>Password</dt>
            <dd>••••••••••••</dd>
          </div>
          <div>
            <dt>Two-factor code</dt>
            <dd class="totp"><span class="totp-digits">{demoCode.slice(0, 3)} {demoCode.slice(3)}</span></dd>
          </div>
        </dl>
        <div class="totp-countdown" aria-label="Example code refreshes every 10 seconds">
          <span
            onanimationiteration={() => {
              codeCycle += 1;
            }}></span>
        </div>
        <div class="secret-note"><Icon name="shield" size={16} /> Encrypted in your browser</div>
      </div>
      <div class="recovery-slip">
        <Icon name="key" size={18} /><span>Recovery codes<br /><small>8 codes saved</small></span><code
          >•••• − ••••</code>
      </div>
    </div>
  {:else if service === 'email'}
    <div class="mail-art">
      <div class="mail-notification">
        <span><Icon name="mail" size={17} /></span>
        <div><strong>New email received</strong><small>Studio workspace · just now</small></div>
        <i></i>
      </div>

      <div class="record">
        <div class="window-bar mail-heading">
          <span>{examples.email.name}'s inbox</span>
          <span class="mail-back"><Icon name="back" size={12} />Back</span>
        </div>
        <div class="message">
          <code>To: {examples.email.email}</code>
          <h4>Your project invitation is here</h4>
          <p>Lucia invited you to the studio workspace. Your project files are ready.</p>
          <span class="fake-link">View invitation</span>
        </div>
        <div class="record-footer">Delivered to your identity's inbox.</div>
      </div>
    </div>
  {:else if service === 'phone'}
    <div class="phone-art">
      <div class="phone-device">
        <div class="phone-frame">
          <div class="phone-camera"></div>
          <div class="phone-top">
            <span class="contact-avatar">Z</span>
            <div><strong>{examples.phone.name}</strong><span>SMS conversation</span></div>
          </div>
          <code class="phone-number">{examples.phone.phone}</code>
          <div class="sms-time">Today, 16:42</div>
          <div class="sms-message">Are we still meeting at the studio tomorrow?</div>
          <div class="sms-response">Yes, see you at 10!</div>
          <span class="sms-delivered">Delivered</span>
          <div class="sms-typing" aria-label="A reply is being typed"><span></span><span></span><span></span></div>
          <div class="phone-home"></div>
        </div>
      </div>
    </div>
  {:else if service === 'wallet'}
    <BlockchainVisual />
  {:else if service === 'card'}
    <div class="payment-art">
      <div class="payment-card">
        <div><span>ShadowSelf</span><small>Virtual card</small></div>
        <span class="card-chip" aria-hidden="true"></span>
        <code>•••• &nbsp; •••• &nbsp; •••• &nbsp; 0042</code>
        <div><span>{examples.card.name}</span><span class="card-circles" aria-hidden="true"></span></div>
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
    <DriveVisual />
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
  .portrait-scan {
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
    color: var(--accent);
    padding: 15px 25px;
  }
  .mail-art .record-footer {
    color: #e6ebff;
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
    color: var(--accent-light);
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
    border: 1px solid color-mix(in srgb, var(--feature-vault) 25%, transparent);
    background: color-mix(in srgb, var(--feature-vault) 6%, transparent);
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
  .secret-note {
    margin: 4px 23px 23px;
    padding: 12px;
    border: 1px solid color-mix(in srgb, var(--feature-vault) 15%, transparent);
    background: color-mix(in srgb, var(--feature-vault) 3%, transparent);
    border-radius: 6px;
    color: #d6bc80;
    font-size: 10px;
    line-height: 1.7;
  }
  .mail-art {
    padding-top: 0;
    isolation: isolate;
  }
  .mail-art .record {
    position: relative;
    z-index: 1;
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
    background: color-mix(in srgb, var(--feature-email) 35%, #111827);
    border: 1px solid var(--feature-email);
    border-radius: 5px;
    color: #ffe9ef;
    font-size: 11px;
  }
  .phone-art {
    display: grid;
    justify-items: center;
    gap: 24px;
    width: 100%;
    padding-top: 14px;
  }
  .phone-device {
    position: relative;
    width: 240px;
  }
  .phone-frame {
    position: relative;
    width: 240px;
    min-height: 374px;
    padding: 38px 17px 38px;
    border: 2px solid #39516a;
    border-radius: 30px;
    background: linear-gradient(155deg, #192a40, #0d1627);
    box-shadow: 12px 20px 40px #0005;
    transform: rotate(-3deg);
  }
  .phone-camera {
    position: absolute;
    width: 42px;
    height: 5px;
    border-radius: 6px;
    background: #080f1b;
    top: 14px;
    left: calc(50% - 21px);
  }
  .phone-top {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #e0f2fe;
  }
  .contact-avatar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #38bdf826;
    color: #7dd3fc;
    font-size: 13px;
  }
  .phone-top strong {
    display: block;
    font-size: 12px;
    font-weight: 500;
  }
  .phone-top div > span {
    display: block;
    margin-top: 3px;
    color: #85a9c6;
    font-size: 9px;
  }
  .phone-number {
    display: block;
    margin-top: 16px;
    padding-bottom: 15px;
    border-bottom: 1px solid #7dd3fc18;
    color: #81b5d2;
    font-size: 10px;
    text-align: center;
  }
  .sms-time {
    margin: 17px 0 13px;
    color: #7995af;
    font-size: 9px;
    text-align: center;
  }
  .sms-message,
  .sms-response {
    max-width: 90%;
    font-size: 11px;
    line-height: 1.65;
    padding: 12px 13px;
    border-radius: 13px;
  }
  .sms-message {
    background: #213b57;
    border-bottom-left-radius: 4px;
    color: #d5eaff;
  }
  .sms-response {
    margin: 13px 0 0 auto;
    width: fit-content;
    border-bottom-right-radius: 4px;
    background: #17658a;
    color: #e4f5ff;
  }
  .sms-delivered {
    display: block;
    margin-top: 5px;
    font-size: 8px;
    text-align: right;
    color: #7995af;
  }
  .phone-home {
    position: absolute;
    width: 64px;
    height: 3px;
    border-radius: 3px;
    background: #6e8198;
    bottom: 12px;
    left: calc(50% - 32px);
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
    .portrait-scan {
      width: 65px;
      height: 80px;
    }
    .person h4 {
      font-size: 20px;
    }
  }
  @media (max-width: 380px) {
    .person h4 {
      font-size: 17px;
    }
    .fields > div {
      flex-wrap: wrap;
    }
  }
  .vault-art,
  .payment-art,
  .proxy-art {
    width: 100%;
    max-width: 470px;
    position: relative;
  }
  .vault-art {
    padding: 40px 14px 30px;
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
    --icon-color: var(--feature-vault);
    position: relative;
    z-index: 2;
    margin: -10px 0 0 30px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid color-mix(in srgb, var(--feature-vault) 25%, transparent);
    border-radius: 8px;
    background: #29251b;
    color: var(--feature-vault);
    transform: rotate(3deg);
    font-size: 11px;
  }
  .recovery-slip code {
    margin-left: auto;
  }
  .payment-art {
    padding: 35px 10px;
  }
  .payment-card {
    padding: 26px;
    border: 1px solid color-mix(in srgb, var(--feature-card) 38%, transparent);
    border-radius: 16px;
    background:
      radial-gradient(ellipse at 80% 10%, color-mix(in srgb, var(--feature-card) 15%, transparent), transparent 65%),
      linear-gradient(140deg, #392544, #161525);
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
      radial-gradient(
        circle at 11px 11px,
        color-mix(in srgb, var(--feature-card) 50%, transparent) 0 10px,
        transparent 11px
      ),
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
    border: 1px solid color-mix(in srgb, var(--feature-card) 19%, transparent);
    border-radius: 8px;
    transform: rotate(3deg);
    color: #e6ebff;
    font-size: 11px;
  }
  .payment-receipt :global(svg[data-icon='card']) {
    color: inherit;
  }
  .payment-receipt strong {
    display: block;
    margin-top: 5px;
    color: inherit;
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
    color: var(--feature-proxy);
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
    fill: var(--feature-proxy);
    stroke: color-mix(in srgb, var(--feature-proxy) 25%, transparent);
    stroke-width: 12;
  }
  .route-origin,
  .route-destination {
    position: absolute;
    top: 63%;
    left: 10%;
    color: var(--feature-proxy);
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
    border: 1px solid color-mix(in srgb, var(--feature-proxy) 21%, transparent);
    background: #17211c;
    border-radius: 8px;
    color: var(--feature-proxy);
    font-size: 11px;
  }
  .proxy-ticket code {
    display: block;
    margin-top: 6px;
  }
  .proxy-ticket i {
    width: 6px;
    height: 6px;
    background: var(--feature-proxy);
    border-radius: 50%;
    margin-left: auto;
    box-shadow: 0 0 12px color-mix(in srgb, var(--feature-proxy) 44%, transparent);
  }
  .identity-pass,
  .payment-card,
  .message {
    position: relative;
    overflow: hidden;
  }
  .payment-card::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      110deg,
      transparent 35%,
      color-mix(in srgb, var(--feature-card) 9%, transparent) 50%,
      transparent 65%
    );
    animation: card-reflection 8s ease-in-out infinite;
  }
  .portrait-scan {
    position: relative;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--accent) 37.65%, transparent);
    flex-shrink: 0;
  }
  .portrait-scan img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 45% 25%;
  }
  .portrait-scan > span {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 28%;
    border-bottom: 1px solid #c7d2fe;
    background: linear-gradient(transparent, color-mix(in srgb, var(--accent) 23.14%, transparent));
    box-shadow: 0 3px 9px color-mix(in srgb, var(--accent) 37.65%, transparent);
    animation: identity-scan 5s ease-in-out infinite;
  }
  .totp-digits {
    color: var(--feature-vault);
    font-size: 20px;
    letter-spacing: 2px;
    font-variant-numeric: tabular-nums;
  }
  .totp-countdown {
    height: 4px;
    margin: 3px 23px 17px;
    border-radius: 2px;
    overflow: hidden;
    background: color-mix(in srgb, var(--feature-vault) 14%, transparent);
  }
  .totp-countdown > span {
    display: block;
    height: 100%;
    background: var(--feature-vault);
    transform-origin: left;
    animation: totp-timer 10s linear infinite;
  }
  .mail-notification {
    position: absolute;
    top: 0;
    left: 10px;
    right: 12px;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 13px;
    border: 1px solid color-mix(in srgb, var(--feature-email) 55%, transparent);
    border-radius: 8px;
    background: #231823;
    box-shadow: 0 10px 25px #0005;
    animation: email-arrival 7s ease-in-out infinite;
  }
  .mail-heading {
    gap: 8px;
    justify-content: space-between;
  }
  .mail-heading > span:first-child {
    min-width: 0;
    flex: 1;
  }
  .mail-back {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  .mail-notification strong {
    display: block;
    color: #ffe0e4;
    font-size: 11px;
    font-weight: 500;
  }
  .mail-notification small {
    display: block;
    margin-top: 5px;
    font-size: 9px;
    color: #bd929f;
  }
  .mail-notification > i {
    margin-left: auto;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--feature-email);
  }
  .sms-typing {
    display: flex;
    gap: 4px;
    width: fit-content;
    margin-top: 12px;
    border-radius: 12px 12px 12px 4px;
    padding: 12px;
    background: #213b57;
  }
  .sms-typing > span {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--feature-phone);
    animation: typing-dot 1.5s ease-in-out infinite;
  }
  .sms-typing > span:nth-child(2) {
    animation-delay: 0.2s;
  }
  .sms-typing > span:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes identity-scan {
    0%,
    12% {
      transform: translateY(-110%);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    70% {
      transform: translateY(360%);
      opacity: 1;
    }
    80%,
    100% {
      transform: translateY(360%);
      opacity: 0;
    }
  }
  @keyframes totp-timer {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }
  @keyframes email-arrival {
    0%,
    8% {
      transform: translateY(-14px);
      opacity: 0;
    }
    18%,
    72% {
      transform: translateY(0);
      opacity: 1;
    }
    90%,
    100% {
      transform: translateY(-8px);
      opacity: 0;
    }
  }
  @keyframes typing-dot {
    0%,
    60%,
    100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-3px);
      opacity: 1;
    }
  }
  @keyframes card-reflection {
    0%,
    45% {
      transform: translateX(-100%);
    }
    80%,
    100% {
      transform: translateX(100%);
    }
  }
  @keyframes route-travel {
    to {
      stroke-dashoffset: -100;
    }
  }
  @media (max-width: 380px) {
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
