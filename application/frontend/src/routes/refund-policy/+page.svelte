<script>
  import {REFUND_POLICY_LAST_MODIFIED} from '$constant';
</script>

<svelte:head>
  <title>ShadowSelf - Refund Policy</title>
  <meta name="description" content="Want a refund? Cool, just check out our refund policy first" />
</svelte:head>

<div>
  <h1>Refund Policy</h1>
  <h6>Want a refund? Cool, just check out our refund policy first.</h6>
  <section>
    <p>
      <span>TLDR</span> Not sure if Shadowself is right for you? No problem! If you purchased an identity and it was created less than 14
      days ago, you can get a full refund. For credit card payments, just delete that specific identity from its individual page, and if
      eligible, your refund will be processed automatically. For cryptocurrency payments, delete the identity and then contact us with your
      Identity ID, email address and a Monero (XMR) address to receive your refund manually.
    </p>
  </section>

  <h3>Our Commitment</h3>
  <p>
    At Shadowself, we are committed to your satisfaction and aim to provide high-quality services. We understand that sometimes a
    service may not be the right fit, which is why we offer this refund policy.
  </p>

  <h3>Eligibility for a Refund</h3>
  <p>You are eligible for a full refund under the following conditions:</p>
  <ul>
    <li>
      The refund request is made within <b>14 calendar days</b> of the initial purchase and creation date of the specific Shadowself identity
      you wish to have refunded.
    </li>
    <li>You initiate the refund request by deleting the specific identity via its individual page on our platform.</li>
    <li>
      You have not violated our <a href="/terms-of-service">Terms of Service</a> in relation to the identity or your account.
    </li>
  </ul>
  <p>
    This 14-day refund policy applies to the initial purchase of each individual identity. If you purchase multiple identities at
    different times, the 14-day window applies separately to each from its respective purchase/creation date.
  </p>

  <h3>How to Request a Refund</h3>
  <p>To request a refund, please follow these steps:</p>
  <ol>
    <li>Navigate to the individual page of the Shadowself identity for which you are seeking a refund.</li>
    <li>Delete the identity in the confirmation modal.</li>
    <li>
      Our system will automatically check if the identity was created less than 14 days ago. If eligible, the refund process will be
      initiated automatically for credit card payments.
    </li>
    <li>
      <b>If you paid with cryptocurrency:</b> Because crypto transactions are irreversible, we process these refunds manually. After
      deleting the identity, please contact us through our <a href="/contact">contact page</a> with your <b>Identity ID</b>, the email
      you used to register to ShadowSelf and a secure <b>Monero (XMR) address</b>.
    </li>
  </ol>
  <p>
    Optionally, you can let us know the reason for your refund request by contacting us through our <a href="/contact">contact page</a
    >. Your feedback is valuable and helps us improve our service, but providing a reason is not required for an eligible refund.
  </p>

  <h3>Refund Processing</h3>
  <p>Once an eligible refund is initiated by deleting the identity:</p>
  <ul>
    <li>
      <b>For Credit Cards:</b> Our system will process the refund request automatically, typically within a few minutes. The refund
      will be issued to the original payment method used for the purchase. Please note that while we process the refund promptly on our
      end, it may take your bank or payment provider an additional <b>5-10 business days</b> (or longer, depending on the provider) to reflect
      the refunded amount in your account. This timeframe is outside of our direct control.
    </li>
    <li>
      <b>For Cryptocurrency:</b> We process these manually, usually within 72 hours of receiving your email with your XMR address. To
      keep things simple and secure on our end, all manual refunds for canceled service or overpayments are issued in
      <b>Monero (XMR)</b>, regardless of which coin you originally used to pay. Network transaction fees are non-refundable.
    </li>
  </ul>

  <h3>Failed Crypto Swaps & Overpayments</h3>
  <ul>
    <li>
      <b>If a swap fails:</b> If you are paying with a coin other than Monero (like Litecoin or Bitcoin) and the transaction times out or
      fails to confirm, our swap partner will automatically return the funds to the 'Refund Address' you provided during checkout. Always
      double-check that address before sending.
    </li>
    <li>
      <b>If you overpay:</b> If you accidentally send more Monero than the invoice requested, the system will activate your account, but
      it won't automatically credit the excess. Just reach out to us, and we'll manually refund the difference.
    </li>
  </ul>

  <h3>Non-Refundable Circumstances</h3>
  <p>Refunds will generally not be provided in the following circumstances:</p>
  <ul>
    <li>Requests made after the 14-day eligibility period for the specific identity has expired.</li>
    <li>If you have violated our <a href="/terms-of-service">Terms of Service</a>.</li>
  </ul>

  <h3>Data Privacy</h3>
  <p>
    Any personal information processed in relation to your refund request will be handled in accordance with our
    <a href="/privacy-policy">Privacy Policy</a>. Deleting an identity as part of the refund process will also be subject to the data
    handling practices outlined therein.
  </p>

  <h3>Changes to this Refund Policy</h3>
  <p>
    We reserve the right to modify this Refund Policy at any time. Any changes will be effective immediately upon posting the updated
    policy on our Website. We encourage you to periodically review this page for the latest information on our refund practices.
  </p>

  <h3>Contact Us</h3>
  <p>
    If you have any questions or concerns regarding this Refund Policy, or if you encounter any issues with the automated refund
    process, please do not hesitate to contact us via our <a href="/contact">contact page</a>.
  </p>
  <small class="text-lg text-neutral-500">Last updated: {REFUND_POLICY_LAST_MODIFIED}</small>
</div>

<style lang="postcss">
  @reference "$style";

  div {
    @apply mx-auto my-40 flex h-fit w-11/12 flex-col gap-6 text-neutral-400 md:w-3/4 xl:w-1/2;
  }

  h1 {
    @apply basic-style text-5xl sm:text-6xl md:text-7xl;
  }

  h3 {
    @apply mt-4 text-3xl text-neutral-300 md:text-5xl;
  }

  h6 {
    @apply -mt-6 text-xl text-neutral-300 md:mb-4 md:text-2xl;
  }

  li {
    @apply list-inside list-disc pl-8;

    & b {
      @apply font-semibold text-neutral-300;
    }
  }

  section {
    @apply border-primary-700 ml-8 border-l-4 pl-4;

    & span {
      @apply text-primary-700 pr-2 font-bold;
    }

    & p {
      @apply text-neutral-300;
    }
  }
</style>
