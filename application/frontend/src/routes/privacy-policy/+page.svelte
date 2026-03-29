<script>
  import {PRIVACY_POLICY_LAST_MODIFIED} from '$constant';
</script>

<svelte:head>
  <title>ShadowSelf - Privacy Policy</title>
  <meta name="description" content="Get to know how we handle your data and privacy." />
</svelte:head>

<div>
  <h1>Privacy Policy</h1>
  <h6>Get to know how we handle your data and privacy.</h6>
  <section>
    <p>
      <span>TLDR</span> We deeply value your privacy by designing our system to know as little about you as possible. We operate on a strict
      data-minimization and no-log basis. We do not track your traffic, we do not log your IP address, and we do not sell your information.
      Fiat payments are securely handled by third-party processors, while cryptocurrency payments remain completely anonymous. Because we
      collect almost nothing, there is almost nothing to expose or hand over.
    </p>
  </section>

  <h3>Introduction</h3>
  <p>
    Shadowself ("We", "Us") is built on the cypherpunk ethos that privacy is a fundamental right. This Privacy Policy explains our
    zero-knowledge approach to how we handle the absolute minimum information required when you visit our website
    <a href="https://shadowself.io">shadowself.io</a> (and our associated Tor .onion hidden service) and use our synthetic identity tools.
  </p>

  <h3>Information We Collect</h3>
  <p>We adhere to strict data minimization. We only collect the technical baseline required to keep your account functional.</p>
  <ul>
    <li>
      <b>Account Credentials:</b> When you create an account, we collect a username and a password. Your password is stored in a heavily
      cryptographically hashed format. It is mathematically impossible for us to view or retrieve your actual password.
    </li>
    <li>
      <b>Fiat Payment Information (Optional):</b> If you choose to pay using fiat currency (credit cards), transactions are handled entirely
      by a secure third-party processor (Stripe). We do not directly collect, process, or store your credit card numbers. We only receive
      a transaction ID and basic billing status to activate your account.
    </li>
    <li>
      <b>Cryptocurrency Payments:</b> If you pay using cryptocurrency (such as Monero), we collect absolutely zero personal or financial
      identifying information. The transaction is verified strictly via cryptographic proof on the blockchain.
    </li>
    <li>
      <b>Contact Information (Optional):</b> If you contact us for support, we will see whatever communication method you use (such as an
      email address or anonymous messaging handle). We use this solely to reply to you and delete it when the issue is resolved.
    </li>
  </ul>

  <h3>Zero-Knowledge & No-Log Policy</h3>
  <p>Our service is designed to protect you, which means we must remain blind to your activities.</p>
  <ul>
    <li><b>No IP Logging:</b> We do not log or store the IP addresses of our users.</li>
    <li>
      <b>No Traffic Logging:</b> We do not monitor, record, or store the traffic, destination, or contents of the synthetic identities you
      create.
    </li>
    <li>
      <b>Tor Accessibility:</b> For absolute network-level anonymity, our service is accessible via the Tor network. We encourage privacy-conscious
      users to utilize our .onion hidden service.
    </li>
    <li>
      <b>No Analytics:</b> We prioritize user privacy by completely refraining from the use of any third-party spyware, behavioral tracking,
      or analytics tools (like Google Analytics) on our platform.
    </li>
  </ul>

  <h3>Data Sharing and Disclosure</h3>
  <p>
    We do not sell, rent, or trade your personal information. Because our system is built on data minimization, we physically do not
    possess the data that data-brokers usually seek. We only share data in the following unavoidable circumstance:
  </p>
  <ul>
    <li>
      <b>Fiat Payment Processors:</b> To facilitate traditional payments, necessary transaction tokens are shared with our payment processor
      (Stripe). They are independently responsible for securely processing your payment details according to their own privacy policy.
    </li>
    <li>
      <b>Law Enforcement & Subpoenas:</b> We comply with legally binding court orders. However, our strict No-Log policy means that we cannot
      hand over information we do not possess. We cannot provide traffic logs, IP histories, or usage data because they do not exist on our
      servers.
    </li>
  </ul>

  <h3>Data Security</h3>
  <p>
    We implement aggressive technical security measures designed to protect our infrastructure. This includes using end-to-end
    encrypted routing, hashing all credentials, and strictly limiting database access. However, no system on the internet is 100%
    secure. By using Shadowself, you acknowledge the inherent risks of online infrastructure. The best security is anonymity, which is
    why we encourage the use of our Tor service and cryptocurrency payment gateways.
  </p>

  <h3>Data Retention & Account Deletion</h3>
  <p>We do not hoard dead data. We retain your minimal account information only for as long as your account is active.</p>
  <ul>
    <li>
      <b>Active Accounts:</b> Usernames and hashed passwords are retained to allow you to access the service.
    </li>
    <li>
      <b>Account Deletion:</b> If you delete an identity or your entire account, the associated data is immediately and permanently purged
      from our active databases. There is no "recovery period" or soft-delete. Once it is gone, it is mathematically unrecoverable.
    </li>
  </ul>

  <h3>Your Privacy Rights</h3>
  <p>Regardless of your global jurisdiction, we believe all users are entitled to total digital sovereignty. You have the right to:</p>
  <ul>
    <li><b>Access:</b> View the data tied to your account.</li>
    <li>
      <b>Erasure (Right to be Forgotten):</b> Delete your synthetic identities or your entire account at any time, initiating an immediate
      purge of your data.
    </li>
  </ul>
  <p>These actions can be performed autonomously within your account dashboard without needing our permission or intervention.</p>

  <h3>Children's Privacy</h3>
  <p>
    Our Service is not directed to individuals under the age of 16. We do not knowingly collect information from children. If we become
    aware that we have collected data from a minor, we will immediately purge that account from our systems.
  </p>

  <h3>Changes to this Privacy Policy</h3>
  <p>
    We reserve the right to update this Privacy Policy periodically. We will notify you of any changes by posting the revised Privacy
    Policy on the Website and updating the "Last updated" date below. We encourage you to periodically review this Privacy Policy.
  </p>

  <h3>Contact Us</h3>
  <p>
    If you have any questions, concerns, or technical inquiries regarding our privacy infrastructure, please contact us through our
    <a href="/contact">contact page</a>.
  </p>
  <hr />
  <p>
    By using our Website, you acknowledge that you have read and understood this Privacy Policy. Stay secure, stay anonymous, and thank
    you for trusting Shadowself.
  </p>
  <small class="text-lg text-neutral-500">Last updated: {PRIVACY_POLICY_LAST_MODIFIED}</small>
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
