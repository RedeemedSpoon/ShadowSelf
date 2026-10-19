<script lang="ts">
  import PublicPage from '$component/public/PublicPage.svelte';
</script>

<svelte:head
  ><title>Refund policy | ShadowSelf</title><meta
    name="description"
    content="Eligibility and procedures for refunds of initial ShadowSelf identity purchases within 14 days." /></svelte:head>

<PublicPage title="Refund policy" description="Eligible initial identity purchases have a 14-day refund window.">
  <section class="policy-summary" aria-label="Policy summary">
    <h2>TLDR</h2>
    <p>
      Eligible initial purchases have a 14-day refund window. For card payments, delete the identity to initiate its
      refund. For crypto, keep it active and contact us with the identity ID and a Monero refund address. Renewals and
      infrastructure abuse are outside the guarantee. Provider failures can delay processing.
    </p>
  </section>

  <h2>Eligibility</h2>
  <p>
    The refund policy covers the initial purchase of each identity when the request falls within 14 calendar days of its
    initial purchase and creation, and you have not violated the <a href="/terms-of-service">terms of service</a>.
  </p>
  <p>
    Abuse that causes an identity's resources to be banned or blacklisted, including spam or phishing, is not eligible.
    Renewals and requests outside the initial eligibility period do not receive the same 14-day guarantee.
  </p>
  <h2>Credit card payments</h2>
  <ol>
    <li>Open the identity you want to delete.</li>
    <li>Review the deletion and refund information shown by the application.</li>
    <li>Confirm deletion. The service checks eligibility and initiates an eligible refund through Stripe.</li>
  </ol>
  <p>
    Refund or cleanup work can remain pending if a provider fails. Bank processing usually takes another 5 to 10
    business days after the refund.
  </p>
  <h2>Cryptocurrency payments</h2>
  <ol>
    <li>Keep the identity active until the purchase can be checked.</li>
    <li>Use the <a href="/contact">contact page</a> and provide the identity ID and your Monero XMR refund address.</li>
    <li>After verification, the project processes the refund manually and deletes the identity.</li>
  </ol>
  <p>
    Manual cryptocurrency refunds are issued in Monero XMR, regardless of the payment asset. Network fees are not
    refundable. The processing target is within 72 hours after receiving the required information; provider or
    verification issues can delay completion.
  </p>
  <h2>Failed swaps and overpayments</h2>
  <p>
    If a payment swap fails or times out, the swap provider handles a return to the refund address supplied during
    checkout under its own process. Contact the project if the invoice and payment state disagree.
  </p>
  <p>
    Monero overpayments do not automatically become account credit. Contact us with the invoice or identity ID, payment
    details, and an XMR return address to request review of the difference.
  </p>
  <h2>Data handling</h2>
  <p>
    We use the records needed to verify the purchase and process the refund. Deletion starts resource cleanup and can
    remain pending if a provider is unavailable. The <a href="/privacy-policy">privacy policy</a> explains retention and provider
    records.
  </p>
  <h2>Questions or a delayed refund</h2>
  <p>
    Contact us with the identity or invoice ID and a reply email through the <a href="/contact">contact page</a>.
  </p>
  <small class="policy-date">Last updated October 11, 2026</small>
</PublicPage>
