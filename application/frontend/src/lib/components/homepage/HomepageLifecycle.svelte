<script lang="ts">
  import HomepageAccess from './HomepageAccess.svelte';
</script>

<section class="network-lifecycle" id="lifecycle">
  <div class="chapter-width">
    <div class="lifecycle-heading" data-reveal>
      <h2>A separate account.<br />From signup to sign-in.</h2>
      <p>Keep the profile, verification messages, and saved login together through each step.</p>
    </div>
    <ol class="lifecycle">
      <li data-reveal>
        <span class="lifecycle-dot">1</span>
        <div>
          <h3>Choose an identity</h3>
          <p>Open a profile with its own email address and phone number before signing up elsewhere.</p>
          <div class="lifecycle-example">
            <span>Identity selected</span><strong>Santiago Vega</strong><code>Spain · santiago.vega@example.com</code>
          </div>
        </div>
      </li>
      <li data-reveal>
        <span class="lifecycle-dot">2</span>
        <div>
          <h3>Verify the new account</h3>
          <p>Sign up with that email or number. Read the incoming verification link or code in ShadowSelf.</p>
          <div class="lifecycle-example email-example">
            <span>New email · Trail Notes</span><strong>Your verification code</strong><code>719 204</code>
          </div>
        </div>
      </li>
      <li data-reveal>
        <span class="lifecycle-dot">3</span>
        <div>
          <h3>Save the login</h3>
          <p>Store the website, username, password, and TOTP secret in this identity's account vault.</p>
          <div class="lifecycle-example vault-example">
            <span>trailnotes.example</span><strong>santiago.routes</strong><code>Password saved · TOTP enabled</code>
          </div>
        </div>
      </li>
      <li data-reveal>
        <span class="lifecycle-dot">4</span>
        <div>
          <h3>Sign in next time</h3>
          <p>Choose the same identity, copy its saved login, and use its current two-factor code.</p>
          <div class="lifecycle-example return-example">
            <span>trailnotes.example</span><strong>Signed in as santiago.routes</strong><code
              >Same account, same identity</code>
          </div>
        </div>
      </li>
    </ol>
    <HomepageAccess />
  </div>
</section>

<style>
  .network-lifecycle {
    background: #0b1021;
    padding-block: 110px;
  }
  .lifecycle-heading h2 {
    font-size: clamp(32px, 3.5vw, 45px);
    letter-spacing: -2px;
    margin-bottom: 25px;
  }
  .lifecycle {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    margin-top: 65px;
    padding: 0;
    list-style: none;
  }
  .lifecycle li {
    position: relative;
    padding: 33px 23px 0 0;
  }
  .lifecycle li:not(:last-child)::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 1px;
    background: #547597;
  }
  .lifecycle-heading > p {
    max-width: 650px;
    margin-top: 25px;
    font-size: 14px;
  }
  .lifecycle-dot {
    position: absolute;
    top: -15px;
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    border: 1px solid #6797bd;
    background: #0c1a2b;
    border-radius: 50%;
    color: #8dc6ed;
    font-size: 11px;
  }
  .lifecycle h3 {
    font-size: 18px;
    line-height: 1.5;
    font-weight: 500;
    color: #d4e6f7;
    margin-bottom: 15px;
  }
  .lifecycle p {
    font-size: 12px;
    line-height: 1.9;
    min-height: 116px;
  }
  .lifecycle-example {
    --example-color: var(--accent);
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px 14px;
    margin-top: 23px;
    border: 1px solid #7c67c644;
    border-radius: 7px;
    background: #1c1a35;
  }
  .lifecycle-example > span {
    font-size: 9px;
    color: var(--example-color);
  }
  .lifecycle-example strong {
    font-size: 12px;
    color: var(--accent-light);
    font-weight: 500;
  }
  .lifecycle-example code {
    font-size: 9px;
    color: #9898b9;
    overflow-wrap: anywhere;
  }
  .email-example {
    --example-color: var(--feature-email);
    background: color-mix(in srgb, var(--feature-email) 12%, #0b1021);
    border-color: color-mix(in srgb, var(--feature-email) 30%, transparent);
  }
  .email-example strong {
    color: var(--feature-email);
  }
  .vault-example {
    --example-color: var(--feature-vault);
    background: #292315;
    border-color: #fbbf2443;
  }
  .vault-example strong {
    color: var(--feature-vault);
  }
  .return-example {
    --example-color: #a2dacc;
    background: #16312c;
    border-color: #4ca58b33;
  }
  .return-example strong {
    color: #a2dacc;
  }
  @media (max-width: 1050px) {
    .lifecycle {
      grid-template-columns: 1fr;
      gap: 0;
      margin-left: 14px;
    }
    .lifecycle li {
      padding: 0 0 35px 35px;
      border-top: 0;
      border-left: 1px solid #547597;
    }
    .lifecycle li::before {
      display: none;
    }
    .lifecycle li:last-child {
      border-left: 0;
      min-height: 29px;
    }
    .lifecycle-dot {
      left: -15px;
      top: 0;
    }
    .lifecycle p {
      min-height: 0;
      max-width: 600px;
    }
    .lifecycle-example {
      margin-top: 18px;
      max-width: 430px;
    }
  }
  @media (max-width: 700px) {
    .network-lifecycle {
      padding-block: 65px;
    }
    .lifecycle-heading h2 {
      font-size: clamp(23px, 6.3vw, 34px);
      letter-spacing: -0.8px;
    }
    .lifecycle {
      margin-top: 45px;
    }
  }
</style>
