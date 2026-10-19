<section class="privacy" id="privacy">
  <div class="chapter-width">
    <div class="privacy-heading" data-reveal>
      <h2>Your secrets.<br />Encrypted in your browser.</h2>
      <div>
        <p>
          Vault passwords, TOTP secrets, and wallet signing keys are encrypted before storage. Your identity's master
          password stays in your browser.
        </p>
        <div class="privacy-links">
          <a class="inline-link" href="https://github.com/RedeemedSpoon/ShadowSelf">Inspect the source</a><a
            class="inline-link"
            href="/privacy-policy">Read the privacy policy</a>
        </div>
      </div>
    </div>
    <div class="encryption-explanation" data-reveal>
      <div class="encryption-copy">
        <h3>Unlock when you need it.</h3>
        <p>
          Enter the identity's master password to access saved passwords, generate two-factor codes, or authorize a
          wallet transfer.
        </p>
      </div>
      <div
        class="encryption-diagram"
        aria-label="Secrets are encrypted in your browser before storage. The master password stays in the browser.">
        <div class="encryption-browser">
          <span>Your browser</span>
          <div>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"
              ><rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.5" /><path
                d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"
                stroke="currentColor"
                stroke-width="1.5" /></svg
            ><strong>Encrypt locally</strong>
          </div>
          <small>Your master password</small>
        </div>
        <div class="encrypted-transfer" aria-hidden="true"><span></span><i>→</i></div>
        <div class="encryption-storage">
          <span>Stored by ShadowSelf</span><code>Encrypted…<br />…b7d4e1</code><small>Encrypted values</small>
        </div>
      </div>
      <div class="privacy-scope">
        <strong>Encryption boundary</strong>
        <p>Profiles, account metadata, email, SMS, and billing records are outside vault encryption.</p>
      </div>
    </div>
  </div>
</section>

<style>
  .privacy {
    padding-block: 110px;
    background: #0b1020;
  }
  .privacy-heading {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 85px;
    margin-bottom: 55px;
  }
  .privacy-heading h2 {
    font-size: clamp(37px, 3.8vw, 52px);
    letter-spacing: -1.8px;
  }
  .privacy-heading p {
    font-size: 14px;
  }
  .encryption-explanation {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px 65px;
    align-items: center;
    padding: 40px;
    border: 1px solid #a5b4fc29;
    background: linear-gradient(120deg, #181c36, #111a2c);
    border-radius: 10px;
  }
  .encryption-copy h3 {
    font-size: 25px;
    font-weight: 500;
    color: #e0e7ff;
    margin: 0 0 15px;
  }
  .encryption-copy p {
    font-size: 13px;
  }
  .encryption-diagram {
    display: grid;
    grid-template-columns: 1fr 45px 1fr;
    align-items: center;
  }
  .encryption-browser,
  .encryption-storage {
    padding: 20px 14px;
    border: 1px solid #a5b4fc36;
    background: #101629;
    border-radius: 7px;
  }
  .encryption-diagram span {
    font-size: 10px;
    color: #9baac8;
    display: block;
  }
  .encryption-browser > div {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-block: 23px;
  }
  .encryption-browser svg {
    width: 25px;
    height: 25px;
    color: var(--color-indigo-300);
    flex-shrink: 0;
  }
  .encryption-browser strong {
    font-size: 11px;
    font-weight: 500;
    color: #d5dcf7;
  }
  .encryption-diagram small {
    font-size: 9px;
    color: #9caaca;
  }
  .encryption-storage code {
    display: block;
    margin-block: 17px;
    font-size: 13px;
    line-height: 1.5;
    letter-spacing: 2px;
    color: var(--color-violet-300);
  }
  .encrypted-transfer {
    height: 1px;
    background: #818cf850;
    position: relative;
  }
  .encrypted-transfer span {
    width: 8px;
    height: 3px;
    background: #a5b4fc;
    position: absolute;
    top: -1px;
    animation: encrypt-transfer 3s linear infinite;
  }
  .encrypted-transfer i {
    position: absolute;
    right: 0;
    top: -11px;
    font-size: 14px;
    font-style: normal;
    color: #a5b4fc;
  }
  .privacy-scope {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 30px;
    padding: 24px 0 0;
  }
  .privacy-scope strong {
    color: #c6bfdc;
    font-size: 12px;
    font-weight: 500;
    padding-top: 4px;
  }
  .privacy-scope p {
    font-size: 12px;
    color: #929fbc;
  }
  .privacy-links {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    margin-top: 30px;
  }
  @keyframes encrypt-transfer {
    from {
      left: 0;
      opacity: 0;
    }
    25%,
    75% {
      opacity: 1;
    }
    to {
      left: calc(100% - 8px);
      opacity: 0;
    }
  }
  @media (max-width: 1000px) {
    .privacy-heading {
      gap: 40px;
    }
    .encryption-explanation {
      gap: 30px;
      padding: 30px;
    }
  }
  @media (max-width: 800px) {
    .encryption-explanation {
      grid-template-columns: 1fr;
    }
    .encryption-diagram {
      max-width: 480px;
      width: 100%;
      margin: auto;
    }
  }
  @media (max-width: 650px) {
    .privacy {
      padding-block: 65px;
    }
    .privacy-heading {
      grid-template-columns: 1fr;
      gap: 25px;
      margin-bottom: 35px;
    }
    .encryption-explanation {
      padding: 24px 18px;
    }
    .encryption-diagram {
      grid-template-columns: 1fr 25px 1fr;
    }
    .encryption-browser,
    .encryption-storage {
      padding: 17px 10px;
    }
    .encryption-browser > div {
      flex-direction: column;
      align-items: start;
      gap: 8px;
      margin-block: 14px;
    }
    .encryption-storage code {
      margin-block: 26px;
      font-size: 12px;
    }
    .encryption-diagram span,
    .encryption-diagram small {
      font-size: 8px;
    }
    .privacy-scope {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .privacy-links {
      gap: 20px;
    }
  }
</style>
