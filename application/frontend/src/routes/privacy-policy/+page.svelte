<script lang="ts">
  import PublicPage from '$component/public/PublicPage.svelte';
</script>

<svelte:head
  ><title>Privacy policy | ShadowSelf</title><meta
    name="description"
    content="What ShadowSelf stores, which secrets your browser encrypts, and how service providers process data." /></svelte:head>

<PublicPage title="Privacy policy">
  <section class="policy-summary" aria-label="Policy summary">
    <h2>TLDR</h2>
    <p>
      We do not sell your information. Your browser encrypts vault passwords, TOTP secrets, and wallet keys; the master
      password stays with you. Profiles, ordinary mail, SMS, and billing records are outside that encryption. Providers
      receive what they need to run their services. A synthetic identity is not a promise that every record disappears.
    </p>
  </section>

  <h2>Account information</h2>
  <p>
    We store your username, email address, password hash, authentication settings, and session records to operate your
    account. Recovery codes and API keys are stored as protected verification values. We cannot retrieve your sign-in
    password from its hash.
  </p>
  <h2>Identity information and messages</h2>
  <p>
    We store identity profiles, portraits, contact details, account-vault metadata, and the records needed to operate
    the services attached to an identity. Email contents and attachments, phone conversations, and service credentials
    are not covered by vault encryption.
  </p>
  <p>Account usernames and website addresses are stored separately from encrypted passwords and TOTP secrets.</p>
  <h2>Browser encryption</h2>
  <p>
    Your browser encrypts protected vault and wallet secrets using your master password before sending them for storage.
    The service stores encrypted values. It does not receive your master password or plaintext wallet signing keys
    through these flows.
  </p>
  <p>
    This protection depends on the password you choose, the security of your browser and device, and the code running in
    that browser. It is not a guarantee that all activity or stored information is invisible to ShadowSelf. We cannot
    recover protected secrets if you lose the master password.
  </p>
  <h2>Payments</h2>
  <p>
    Stripe processes credit card payments. ShadowSelf stores customer, payment, subscription, and invoice references
    needed to activate identities, reconcile payments, and handle cancellations or refunds. We do not store your full
    credit card number.
  </p>
  <p>
    Cryptocurrency billing stores invoice details, amounts, status, transaction observations, and any refund address
    required by the payment flow. Swap providers may process transaction information. Cryptocurrency payments are not
    universally anonymous; public blockchains expose transaction data.
  </p>
  <h2>External services</h2>
  <p>
    Phone providers process phone numbers and message contents. Email delivery services process addresses and mail
    contents. Portrait generation services receive the inputs required to generate an image. Payment and wallet
    providers process the requests needed to deliver their services.
  </p>
  <p>Those providers have their own retention practices and privacy policies.</p>
  <h2>Technical records and tracking</h2>
  <p>
    The application uses account and session records, billing observations, webhook receipts, and cleanup records to
    secure access and recover from interrupted work. It does not include third-party behavioral analytics in its website
    code.
  </p>
  <p>
    Network and server infrastructure may process technical connection information. This policy does not promise that
    every infrastructure or external provider keeps no logs.
  </p>
  <h2>Support messages</h2>
  <p>If you contact the project, we receive the subject, category, message, and any reply email you provide.</p>
  <h2>Sharing and disclosure</h2>
  <p>
    We do not sell personal information. We share the data needed to deliver a service with the corresponding provider,
    and may disclose information when required by applicable law. Browser encryption limits access to protected secrets;
    it does not remove access to other records.
  </p>
  <h2>Deletion and retention</h2>
  <p>
    You can delete an identity or your account in the application. Deletion removes product data and starts cleanup of
    associated provider resources. If a provider fails, cleanup can remain pending and necessary cleanup records may
    remain until it completes.
  </p>
  <p>
    Provider records, backups, payment records, and legally required records may have different retention periods.
    Deleting data from an active database does not establish that every external copy immediately disappears.
  </p>
  <h2>Children and policy changes</h2>
  <p>
    The service is not directed to people under 16. Contact us if you believe a minor has provided account information.
    We publish changes to this policy on this page.
  </p>
  <h2>Questions</h2>
  <p>
    Use the <a href="/contact">contact page</a> for a question about stored information, privacy, or deletion. The
    <a href="https://github.com/RedeemedSpoon/ShadowSelf" rel="noreferrer">source code</a> documents the technical implementation.
  </p>
  <small class="policy-date">Last updated October 11, 2026</small>
</PublicPage>
