<section class="promise" id="what-you-gain">
  <div class="chapter-width promise-layout" data-reveal>
    <div class="promise-heading">
      <h2>Use the services you need. <span>Share less of your personal life.</span></h2>
    </div>
    <div class="promise-copy">
      <p class="promise-lead">You can be reachable without giving every account your everyday email, phone number, and personal profile.</p>
      <p>
        Join a community. Give a project its own public presence. Keep shopping messages out of your personal inbox. Each identity has working tools behind it,
        so you can keep using the accounts you create.
      </p>
    </div>
  </div>
  <div class="promise-balance chapter-width" data-reveal>
    <div><strong>Accounts you can keep using.</strong><span>Contact details, accounts, and conversations you can return to.</span></div>
    <svg viewBox="0 0 160 48" fill="none" aria-hidden="true">
      <path d="M0 24h40m80 0h40" stroke="currentColor" stroke-opacity=".3" />
      <path
        class="balance-track"
        d="M80 24C68 10 60 10 54 16C46 24 52 36 62 34C69 33 74 29 80 24C92 10 100 10 106 16C114 24 108 36 98 34C91 33 86 29 80 24Z"
        stroke="currentColor"
        stroke-width="1.5" />
      <path
        class="balance-path"
        d="M80 24C68 10 60 10 54 16C46 24 52 36 62 34C69 33 74 29 80 24C92 10 100 10 106 16C114 24 108 36 98 34C91 33 86 29 80 24Z"
        pathLength="100"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round" />
    </svg>
    <div><strong>Details you choose to share.</strong><span>You choose which identity and details a service gets.</span></div>
  </div>
</section>

<style>
  .promise {
    padding-block: 105px 65px;
    background: radial-gradient(ellipse at 30% 20%, #6366f115, transparent 65%), #101429;
    border-block: 1px solid #a5b4fc20;
  }
  .promise-layout {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 85px;
    align-items: center;
  }
  .promise-heading h2 {
    font-size: clamp(36px, 3.7vw, 53px);
    letter-spacing: -1.9px;
  }
  .promise-heading h2 span {
    color: var(--color-indigo-300);
  }
  .promise-copy p {
    font-size: 14px;
    margin-bottom: 20px;
  }
  .promise-copy .promise-lead {
    color: #d5dcf0;
    font-size: 17px;
  }
  .promise-balance {
    display: grid;
    grid-template-columns: 1fr 160px 1fr;
    gap: 30px;
    align-items: center;
    margin-top: 65px;
    padding-top: 30px;
    border-top: 1px solid #a5b4fc20;
  }
  .promise-balance > div:last-child {
    text-align: right;
  }
  .promise-balance strong {
    display: block;
    font-size: 14px;
    color: #cbd5ef;
    font-weight: 500;
  }
  .promise-balance span {
    display: block;
    font-size: 11px;
    line-height: 1.8;
    color: #8e9bbb;
    margin-top: 10px;
  }
  .promise-balance svg {
    width: 160px;
    height: 48px;
    color: #a5b4fc;
  }
  .balance-track {
    opacity: 0.4;
  }
  .balance-path {
    stroke-dasharray: 24 76;
    animation: continuity 6s linear infinite;
  }
  @keyframes continuity {
    to {
      stroke-dashoffset: -100;
    }
  }
  @media (max-width: 1000px) {
    .promise-layout {
      gap: 40px;
    }
    .promise-balance {
      grid-template-columns: 1fr 90px 1fr;
      gap: 15px;
    }
    .promise-balance svg {
      width: 90px;
    }
  }
  @media (max-width: 700px) {
    .promise {
      padding-block: 65px 40px;
    }
    .promise-layout {
      grid-template-columns: 1fr;
      gap: 30px;
    }
    .promise-heading h2 {
      font-size: 37px;
      letter-spacing: -1.5px;
    }
    .promise-balance {
      grid-template-columns: 1fr;
      gap: 17px;
      margin-top: 30px;
    }
    .promise-balance svg {
      width: 90px;
      height: 30px;
    }
    .promise-balance > div:last-child {
      text-align: left;
    }
  }
</style>
