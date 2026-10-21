<script lang="ts">
  import HomepageAccess from './HomepageAccess.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import {HOMEPAGE_EXAMPLE_IDENTITY} from '$constant';

  const example = HOMEPAGE_EXAMPLE_IDENTITY;
</script>

<section class="network-lifecycle" id="lifecycle">
  <div class="chapter-width">
    <div class="lifecycle-heading" data-reveal>
      <h2>From a separate profile<br />to an everyday workspace.</h2>
      <p>Create the identity once. Reach its accounts on the website, in your browser, or through the API.</p>
    </div>
    <ol class="lifecycle">
      <li data-reveal>
        <span class="lifecycle-dot">1</span>
        <div>
          <h3>Create the profile</h3>
          <p>Generate a profile, then choose the name and contact details you'll use.</p>
          <div class="lifecycle-example">
            <span>Profile</span><strong>{example.name}</strong><code>@{example.handle}</code>
          </div>
        </div>
      </li>
      <li data-reveal>
        <span class="lifecycle-dot">2</span>
        <div>
          <h3>Register and verify</h3>
          <p>
            Sign up using the identity's email address or phone number. Open the incoming link or code in its workspace.
          </p>
          <div class="lifecycle-example email-example">
            <span>Email</span><strong>Confirm your account</strong><code>{example.email}</code>
          </div>
        </div>
      </li>
      <li data-reveal>
        <span class="lifecycle-dot">3</span>
        <div>
          <h3>Save the credentials</h3>
          <p>Add the website, username, password, and TOTP secret to the account vault.</p>
          <div class="lifecycle-example vault-example">
            <span>Account vault</span><strong>Login + two-factor code</strong><code>Website / password / TOTP</code>
          </div>
        </div>
      </li>
      <li data-reveal>
        <span class="lifecycle-dot">4</span>
        <div>
          <h3>Use the account again</h3>
          <p>Open the same identity for its login, two-factor code, and recovery messages.</p>
          <div class="lifecycle-example return-example">
            <span>Identity workspace</span><strong>{example.name}</strong><code>Accounts / messages / wallet</code>
          </div>
        </div>
      </li>
      <li class="lifecycle-goal" aria-label="Setup complete" data-reveal>
        <span class="lifecycle-dot"><Icon name="check" size={17} /></span>
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
    font-size: 49px;
    letter-spacing: -2px;
    margin-bottom: 25px;
  }
  .lifecycle {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr)) 30px;
    gap: 0;
    margin-top: 65px;
    padding: 0;
    list-style: none;
  }
  .lifecycle li {
    position: relative;
    border-top: 1px solid #547597;
    padding: 33px 23px 0 0;
  }
  .lifecycle-heading > p {
    max-width: 650px;
    margin-top: 25px;
    font-size: 14px;
  }
  .lifecycle-goal {
    border-top: 0 !important;
    padding: 0 !important;
  }
  .lifecycle-goal .lifecycle-dot {
    border-color: #34d39980;
    color: #6ee7b7;
    background: #102a25;
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
    color: #a29dcc;
  }
  .lifecycle-example strong {
    font-size: 12px;
    color: #d0c7f7;
    font-weight: 500;
  }
  .lifecycle-example code {
    font-size: 9px;
    color: #9898b9;
    overflow-wrap: anywhere;
  }
  .email-example {
    background: color-mix(in srgb, var(--feature-email) 12%, #0b1021);
    border-color: color-mix(in srgb, var(--feature-email) 30%, transparent);
  }
  .email-example strong {
    color: var(--feature-email);
  }
  .vault-example {
    background: #292315;
    border-color: #fbbf2443;
  }
  .vault-example strong {
    color: var(--feature-vault);
  }
  .return-example {
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
      font-size: 35px;
      letter-spacing: -1.3px;
    }
    .lifecycle {
      margin-top: 45px;
    }
  }
</style>
