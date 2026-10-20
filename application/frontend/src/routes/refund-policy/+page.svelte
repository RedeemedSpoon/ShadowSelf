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
      Eligible initial purchases have a 14-day refund window. Delete the identity to initiate its refund. For crypto,
      supply a Monero refund address in the deletion dialog. Renewals and infrastructure abuse are outside the
      guarantee. Provider failures can delay processing.
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
    Identity deletion completes independently of card refund processing. Cancellation and eligible refunds are queued
    automatically, including when Stripe is temporarily unavailable. Pending refunds appear in account settings. Bank
    processing usually takes another 5 to 10 business days; failed refunds may need support assistance.
  </p>
  <h2>Cryptocurrency payments</h2>
  <ol>
    <li>Open the identity and choose delete.</li>
    <li>Enter a mainnet Monero XMR address you control outside the identity being deleted.</li>
    <li>
      Confirm deletion. An eligible refund is queued automatically, while the account and other identities remain.
    </li>
  </ol>
  <p>
    Refunds are paid in Monero XMR, including purchases originally swapped from BTC, LTC or ETH. The refund equals the
    original USD purchase value after any crypto discount, converted at the current XMR exchange rate when the payout is
    signed. ShadowSelf pays the outgoing network fee. Original payment and swap fees are not part of the purchase value.
  </p>
  <p>
    The amount is fixed once the payout is signed. Network problems trigger retries of that same payout. Refunds may
    wait for available wallet funds, a current exchange rate, or network confirmation. Pending refunds appear in account
    settings and continue even if the account is deleted.
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
    We use the records needed to verify the purchase and process the refund. Refunds retain only payment references and
    processing details needed to finish the refund after identity deletion. Completed payout jobs and their stored
    destination addresses are removed. Minimal purchase records remain; confirmed blockchain transactions cannot be
    erased. Payment providers retain their own financial records. The <a href="/privacy-policy">privacy policy</a> explains
    retention and provider records.
  </p>
  <h2>Questions or a delayed refund</h2>
  <p>
    Contact us with the refund reference shown in settings, or the identity or invoice ID, and a reply email through the <a
      href="/contact">contact page</a
    >.
  </p>
  <small class="policy-date">Last updated October 20, 2026</small>
</PublicPage>
