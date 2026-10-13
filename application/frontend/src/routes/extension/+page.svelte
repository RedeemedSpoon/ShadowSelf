<script lang="ts">
  import PublicPage from '$component/public/PublicPage.svelte';
  import logo from '$image/brands/shadowself/icon.svg';
</script>

<svelte:head
  ><title>Browser extension | ShadowSelf</title><meta
    name="description"
    content="Connect a browser window to your ShadowSelf account and open the identity workspace while browsing." /></svelte:head>

<PublicPage
  eyebrow="Browser extension"
  title="Your identities, in this window."
  description="Bind each browser window to a ShadowSelf account and open its identities from the extension."
  wide>
  <div class="extension-layout">
    <div>
      <h2>Connect through your signed-in tab</h2>
      <ol>
        <li>Sign in to ShadowSelf in the browser window you want to use.</li>
        <li>Open the extension and choose that signed-in tab to bind the window to its account.</li>
        <li>Select an identity to open its workspace. Switch the binding when you want to use another account.</li>
      </ol>
      <p>The selected tab authenticates extension requests through your existing session.</p>
      <a class="public-action" href="https://github.com/RedeemedSpoon/ShadowSelf/tree/V2/extension" rel="noreferrer"
        >Get the extension source <span aria-hidden="true">↗</span></a>
      <p class="install-note">Follow the repository instructions to build the Chrome or Firefox package, then install it in your browser.</p>
    </div>
    <div class="extension-example" aria-label="Illustrative extension interface">
      <div class="example-top"><img src={logo} width="25" height="25" alt="" /><span>ShadowSelf</span><small>Example</small></div>
      <div class="binding-record"><small>Window account</small><strong>studio_account</strong><span>Connected through signed-in tab</span></div>
      <div class="identity-record">
        <span>TM</span>
        <div><strong>Theo Mercer</strong><small>Selected identity</small></div>
        <b aria-hidden="true">↗</b>
      </div>
    </div>
  </div>
  <div class="policy-note">
    <h2>Browser scope</h2>
    <p>The binding selects a ShadowSelf account. Cookie isolation, browser fingerprints, and network routing depend on your browser setup.</p>
  </div>
</PublicPage>

<style>
  .extension-layout {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 80px;
    align-items: start;
    margin-bottom: 45px;
  }
  .extension-layout h2 {
    margin-top: 0;
  }
  .install-note {
    font-size: 12px;
    margin-top: 18px !important;
  }
  .extension-example {
    max-width: 360px;
    width: 100%;
    border: 1px solid #a5b4fc40;
    background: linear-gradient(150deg, #1b2140, #10172c);
    border-radius: 12px;
    box-shadow: 0 30px 80px #0005;
    overflow: hidden;
  }
  .example-top {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    border-bottom: 1px solid #a5b4fc20;
    font-size: 14px;
    color: #d7def2;
  }
  .example-top small {
    margin-left: auto;
    color: #8491af;
    font-size: 10px;
  }
  .binding-record {
    display: grid;
    gap: 12px;
    padding: 25px 20px;
  }
  .binding-record small {
    color: #9aa7c5;
    font-size: 11px;
  }
  .binding-record strong {
    font:
      15px 'Fira Code Variable',
      monospace;
  }
  .binding-record > span {
    color: #8ca6bd;
    font-size: 10px;
  }
  .identity-record {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 20px;
    border-block: 1px solid #a5b4fc20;
    background: #a5b4fc05;
  }
  .identity-record > span {
    display: grid;
    place-items: center;
    width: 43px;
    height: 43px;
    border: 1px solid #a78bfa40;
    border-radius: 7px;
    color: #c4b5fd;
    background: #a78bfa15;
    font-size: 13px;
  }
  .identity-record div {
    display: grid;
    gap: 7px;
  }
  .identity-record strong {
    font-size: 13px;
  }
  .identity-record small {
    font-size: 10px;
    color: #9aabc8;
  }
  .identity-record b {
    margin-left: auto;
    color: #b6a8f3;
    font-weight: 400;
  }
  @media (max-width: 800px) {
    .extension-layout {
      grid-template-columns: 1fr;
      gap: 30px;
    }
    .extension-example {
      max-width: none;
    }
  }
</style>
