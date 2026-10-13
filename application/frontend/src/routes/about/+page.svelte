<script lang="ts">
  import PublicPage from '$component/public/PublicPage.svelte';
  import logo from '$image/brands/shadowself/icon.svg';
</script>

<svelte:head
  ><title>About | ShadowSelf</title><meta
    name="description"
    content="Why ShadowSelf groups profiles, credentials, messages, and cryptocurrency wallets around separate online identities." /></svelte:head>

<PublicPage
  eyebrow="The project"
  title="A workspace for separate identities."
  description="ShadowSelf gives each online identity its own profile, contact details, credentials, and wallets.">
  <div class="project-record">
    <img src={logo} alt="" width="52" height="52" />
    <div><span>ShadowSelf</span><small>Open-source identity management</small></div>
    <a href="https://github.com/RedeemedSpoon/ShadowSelf" rel="noreferrer">View source <span aria-hidden="true">↗</span></a>
  </div>
  <h2>Why build around an identity?</h2>
  <p>
    Maintaining a pseudonym usually means managing a mailbox, a phone number, credentials, and wallets separately. ShadowSelf uses the identity to organize
    those resources, so they stay together as its accounts accumulate.
  </p>
  <h2>Encryption in your browser</h2>
  <p>
    Your browser encrypts vault passwords, TOTP secrets, and wallet signing material with your identity's master password before storage. The master password
    stays in your browser.
  </p>
  <p>
    Profiles, account metadata, email, SMS, and billing records are outside vault encryption. The <a href="/privacy-policy">privacy policy</a> describes how we store
    and process them.
  </p>
  <h2>Built in the open</h2>
  <p>
    The frontend, backend, and extension share an AGPL-3.0 repository. A <a href="/docs">versioned API</a> supports custom clients and automation. Paid identities
    fund phone numbers, mail delivery, hosting, and development.
  </p>
  <h2>Planned next</h2>
  <p>V2 plans include residential routing, email aliases, and PGP support. Virtual cards and cloud storage are planned for V3.</p>
</PublicPage>

<style>
  .project-record {
    display: flex;
    gap: 20px;
    align-items: center;
    padding: 24px;
    border: 1px solid #a5b4fc25;
    border-radius: 10px;
    background: linear-gradient(130deg, #1a203b, #10172a);
  }
  .project-record > div {
    display: grid;
    gap: 7px;
  }
  .project-record div > span {
    color: #e0e7ff;
    font-size: 19px;
  }
  .project-record small {
    color: #9eabcd;
    font-size: 12px;
  }
  .project-record > a {
    margin-left: auto;
    font-size: 12px;
    white-space: nowrap;
  }
  @media (max-width: 500px) {
    .project-record {
      flex-wrap: wrap;
      padding: 20px;
      gap: 16px;
    }
    .project-record > a {
      margin-left: 0;
      width: 100%;
    }
  }
</style>
