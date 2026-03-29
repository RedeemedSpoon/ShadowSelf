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
      <span>TLDR</span> Not sure if Shadowself is right for you? No problem. If you purchased an identity and it was created less than
      14 days ago, you can get a full refund—provided you haven't intentionally burned the infrastructure. For credit card payments,
      just delete that specific identity from its individual page to initiate an automatic refund. For cryptocurrency payments,
      <b>do not delete the identity yourself</b>. Contact us with the active Identity ID and a Monero (XMR) address so we can verify
      the purchase, destroy the data, and send your refund.
    </p>
  </section>

  <h3>Our Commitment</h3>
  <p>
    At Shadowself, we are committed to your privacy and satisfaction. We understand that sometimes our synthetic routing or specific
    identifiers might not fit your exact use case, which is why we offer a straightforward refund policy for clean identities.
  </p>

  <h3>Eligibility for a Refund</h3>
  <p>You are eligible for a full refund under the following conditions:</p>
  <ul>
    <li>
      The refund request is made within <b>14 calendar days</b> of the initial purchase and creation date of the specific Shadowself identity.
    </li>
    <li>
      You have not violated our <a href="/terms-of-service">Terms of Service</a>.
    </li>
    <li>
      You have not "burned" the identity's resources (e.g., you did not use it to spam, phish, or abuse third-party platforms resulting
      in our IPs or virtual numbers getting blacklisted).
    </li>
  </ul>
  <p>This 14-day refund policy applies to the initial purchase of each individual identity.</p>

  <h3>How to Request a Refund</h3>
  <p>
    Because we operate on a strict data-purging protocol, the refund process differs based on how you paid. Please follow these steps
    carefully:
  </p>

  <h4>For Fiat (Credit Card) Purchases:</h4>
  <ol>
    <li>Navigate to the individual page of the Shadowself identity for which you are seeking a refund.</li>
    <li>Click delete and confirm via the modal.</li>
    <li>
      Our system will automatically verify if the identity was created less than 14 days ago. If eligible, the refund process is
      initiated automatically through our payment processor, and your data is instantly purged.
    </li>
  </ol>

  <h4>For Cryptocurrency Purchases:</h4>
  <ol>
    <li>
      <b>DO NOT delete the identity yet.</b> If you delete it, our zero-knowledge architecture will permanently purge the record, and we
      will have no mathematical way to verify your purchase to issue a refund.
    </li>
    <li>While the identity is still active, contact us through our <a href="/contact">contact page</a>.</li>
    <li>
      Provide <b>ONLY</b> your active <b>Identity ID</b> and a secure <b>Monero (XMR) address</b>. Do not send us your email or
      personally identifying information.
    </li>
    <li>
      We will verify the identity's eligibility and that the infrastructure has not been burned. Once verified, our team will manually
      destroy the identity (purging the data) and execute the Monero transaction.
    </li>
  </ol>

  <h3>Refund Processing</h3>
  <p>Once an eligible refund is initiated:</p>
  <ul>
    <li>
      <b>For Credit Cards:</b> Our system processes the request automatically. Please note that while we process the refund immediately
      on our end, traditional banking infrastructure may take an additional <b>5-10 business days</b> to reflect the refunded amount in your
      account.
    </li>
    <li>
      <b>For Cryptocurrency:</b> We process these manually, usually within 72 hours of receiving your Identity ID and XMR address. To
      guarantee ultimate privacy on our end, all manual refunds are issued exclusively in <b>Monero (XMR)</b>, regardless of which coin
      you originally used to pay. Network transaction fees are non-refundable.
    </li>
  </ul>

  <h3>Failed Crypto Swaps & Overpayments</h3>
  <ul>
    <li>
      <b>If a swap fails:</b> If you are paying with a transparent coin (like Bitcoin or Litecoin) and the transaction times out, our swap
      partner will automatically return the funds to the 'Refund Address' you provided during checkout.
    </li>
    <li>
      <b>If you overpay:</b> If you accidentally send more Monero than the invoice requested, the system will activate your account, but
      it won't automatically credit the excess. Reach out to us with the transaction details and a return XMR address, and we will manually
      refund the difference.
    </li>
  </ul>

  <h3>Non-Refundable Circumstances</h3>
  <p>Refunds will absolutely <b>not</b> be provided in the following circumstances:</p>
  <ul>
    <li>Requests made after the 14-day eligibility period has expired.</li>
    <li>
      <b>Burned Infrastructure:</b> If our automated systems detect that your specific identity was used to launch abuse campaigns, mass
      spam, or otherwise intentionally trigger bans on third-party platforms, rendering that identity's IP or phone number useless to the
      Shadowself network.
    </li>
    <li>If you have otherwise violated our <a href="/terms-of-service">Terms of Service</a> (e.g., infrastructure abuse).</li>
  </ul>

  <h3>Data Privacy</h3>
  <p>
    We require zero personal data to process a cryptocurrency refund. Any communication regarding a refund will be handled in strict
    accordance with our <a href="/privacy-policy">Privacy Policy</a>. Once your refund is successfully processed and the identity is
    destroyed, all records associated with that specific synthetic identity are immediately and permanently purged from our active
    databases.
  </p>

  <h3>Changes to this Refund Policy</h3>
  <p>
    We reserve the right to modify this Refund Policy at any time to adapt to network abuse vectors or payment processing changes. Any
    changes will be effective immediately upon posting.
  </p>

  <h3>Contact Us</h3>
  <p>
    If you encounter any issues with the refund process or need to submit your XMR address, please contact us via our
    <a href="/contact">contact page</a>.
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
