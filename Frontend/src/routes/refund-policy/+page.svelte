<svelte:head>
  <title>ShadowSelf - Refund Policy</title>
  <meta name="description" content="Want a refund? Cool, just check out our refund policy first" />
</svelte:head>

<div>
  <h1>Refund Policy</h1>
  <h6>Want a refund? Cool, just check out our refund policy first.</h6>
  <section>
    <p>
      <span>TLDR</span> Not sure if Shadowself is right for you? No problem! You have 14 days to change your mind and receive a full
      refund. Simply delete your identity in the identity settings, and if it was created less than 14 days ago, you’ll be eligible.
      If you also want to help us, you can contact us directly with your identity ID, username, and reason for the request.
    </p>
  </section>
  <p>
    We, Shadowself, are committed to providing you with the highest services quality and customer satisfaction. That's why we
    offer a refund policy for anyone who finds our service unsatisfactory.
  </p>
  <h3>Refund Eligibility</h3>
  <p>
    To ensure your satisfaction, we offer a 14-day, no-questions-asked refund policy. This means you may request a full refund
    within 14 days of your initial purchase, provided that you have not violated any of our terms and conditions.
  </p>
  <h3>How to Request a Refund</h3>
  <p>
    To request a refund, please visit your identity page and delete your identity. If it was created less than 14 days ago, you
    will be eligible for a full refund. And if you'd like to help us improve our service, you can <a href="/contact"
      >contact us</a> directly with a brief explanation of why you're requesting the refund.
  </p>
  <h3>Refund Processing Time</h3>
  <p>
    Upon receipt of your refund request, we will process it promptly. You can expect your refund to be credited to your original
    payment method within 7 business days.
  </p>
  <h3>Data Privacy</h3>
  <p>
    Rest assured that any personal information provided during the refund process will be handled with the utmost care and in
    accordance with our Privacy Policy.
  </p>
  <h3>Contact Us</h3>
  <p>
    Should you have any questions or concerns regarding our refund policy or service, please do not hesitate to contact us and we
    will get back to you as soon as possible.
  </p>
  <small class="text-lg text-neutral-500">Last updated: December 1, 2024</small>
</div>

<style lang="postcss">
  div {
    @apply mx-auto my-[10rem] flex h-fit w-11/12 flex-col gap-6 text-neutral-400 md:w-3/4 xl:w-1/2;
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
