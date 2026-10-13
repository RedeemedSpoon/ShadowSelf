<script lang="ts">
  import PublicPage from '$component/public/PublicPage.svelte';
</script>

<svelte:head
  ><title>Terms of service | ShadowSelf</title><meta
    name="description"
    content="Terms for using ShadowSelf's identity tools, account access, billing, and service providers." /></svelte:head>

<PublicPage title="Terms of service" description="These terms apply to the ShadowSelf website, API, browser extension, and identity services.">
  <h2>Using the service</h2>
  <p>
    By accessing or using ShadowSelf, you agree to these terms. If you do not agree, do not use the service. ShadowSelf lets you generate and manage synthetic
    profiles, account credentials, communications, and cryptocurrency wallets.
  </p>
  <p>
    A generated profile is not an official identity document. It does not establish a real person's identity or satisfy a third party's identity-verification
    requirements. You remain responsible for the information you submit and the accounts you create elsewhere.
  </p>
  <h2>Account security</h2>
  <p>
    You are responsible for protecting your sign-in password, second-factor setup, recovery codes, API keys, and vault master password. Notify the project if
    you discover unauthorized access. We cannot decrypt browser-protected vault or wallet secrets without your master password.
  </p>
  <h2>Prohibited use</h2>
  <p>Do not use the service to:</p>
  <ul>
    <li>Send spam, conduct phishing, distribute malware, or impersonate a real person to defraud others.</li>
    <li>Exploit phone numbers, email systems, payment services, or APIs in ways that violate provider rules or disrupt service.</li>
    <li>Attack, probe without authorization, or interfere with ShadowSelf's infrastructure or another party's systems.</li>
    <li>Distribute illegal content, exploit children, threaten people, or conduct unlawful activities.</li>
  </ul>
  <p>
    We may suspend or terminate access when abuse threatens the service, its users, or its providers. Using a synthetic profile does not excuse harmful or
    unlawful conduct.
  </p>
  <h2>Availability and providers</h2>
  <p>
    Features depend on configured services and external providers. Delivery, phone-number acceptance, portrait generation, wallet reads, and payments can fail
    or become unavailable. ShadowSelf does not guarantee that another website will accept a generated profile, email address, or phone number.
  </p>
  <p>
    Residential routing, virtual cards, cloud storage, email aliases, and PGP are planned features. The current extension opens identity tools through a
    connected account; it does not route traffic or isolate browser cookies.
  </p>
  <h2>Payments and cancellation</h2>
  <p>
    Review the plan, price, billing period, and payment details before authorizing a purchase. Monthly and annual subscriptions recur according to the plan you
    select. Lifetime access is a single payment for the purchased identity and does not guarantee perpetual operation of external services.
  </p>
  <p>
    Deletion or cancellation follows the controls provided in the application. Provider cleanup can remain pending after a deletion request. The <a
      href="/refund-policy">refund policy</a> describes the existing 14-day conditions for eligible initial purchases.
  </p>
  <h2>Data and deletion</h2>
  <p>
    The <a href="/privacy-policy">privacy policy</a> explains what the service stores and which secrets your browser encrypts. Deletion is permanent for product data
    once completed. Keep any information you need before requesting deletion.
  </p>
  <h2>Source and branding</h2>
  <p>
    The project's source code is available under the AGPL-3.0 license. That license governs use of the code. It does not grant permission to present another
    service as the official ShadowSelf product or misuse its branding.
  </p>
  <h2>Limits and responsibility</h2>
  <p>
    The service is provided as available, without a guarantee of uninterrupted operation, universal anonymity, or acceptance by third parties. To the extent
    allowed by applicable law, ShadowSelf and its developers are not liable for indirect losses arising from service interruptions, third-party conduct, or your
    use of synthetic identities.
  </p>
  <p>You remain responsible for your conduct and the content you handle. These terms do not limit rights that applicable law does not allow us to exclude.</p>
  <h2>Changes and contact</h2>
  <p>We publish revised terms here and update the date below. For questions about these terms, use the <a href="/contact">contact page</a>.</p>
  <small class="policy-date">Last updated October 11, 2026</small>
</PublicPage>
