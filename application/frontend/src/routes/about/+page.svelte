<script lang="ts">
  import {systemDesign} from '$image';
</script>

<svelte:head>
  <title>ShadowSelf - About</title>
  <meta name="description" content="Learn more about us, ShadowSelf and our mission." />
</svelte:head>

<div>
  <h1>Who We Are</h1>
  <p>
    We're not a faceless corporation or a team funded by venture capitalists. ShadowSelf is a privacy tool built and maintained by a
    single developer, but we welcome contributions from anyone who can offer their skills and knowledge. To keep this project running
    smoothly, we rely on monetary transactions to cover essential costs like server maintenance and API usage.
  </p>
  <img loading="lazy" class="mx-auto mt-8 w-[75%]" src={systemDesign} alt="System Design" />
  <small class="mb-4 text-center text-neutral-400">System Design for <a href="/" rel="external">ShadowSelf</a></small>
  <h1>Our Mission</h1>
  <p>
    We're here to revolutionize online privacy and anonymity. We believe that everyone deserves the right to a digital life free from
    surveillance and intrusion. With ShadowSelf, you can reclaim your online freedom and protect your identity from prying eyes.
  </p>
  <h1>How We Do It</h1>
  <p>
    ShadowSelf offers a comprehensive suite of tools to help you create and manage synthetic identities. These digital aliases can be
    used to:
  </p>
  <ul>
    <li>
      <b>Protect Your True Identity:</b> Shield your personal information from prying eyes, reducing your vulnerability to cyber threats.
    </li>
    <li>
      <b>Enhance Online Security:</b> Create multiple layers of defense, making it significantly harder for malicious actors to compromise
      your security.
    </li>
    <li>
      <b>Experience Digital Freedom:</b> Explore the internet without limitations, unburdened by the fear of being tracked or profiled.
    </li>
  </ul>
  <h1>Our Commitment</h1>
  <p>
    We're committed to protecting your privacy and anonymity online. We employ state-of-the-art security measures to safeguard your
    data and ensure that your synthetic identities remain secure. Your trust is our priority.
  </p>
  <h1>Join the Movement</h1>
  <p>
    Join a growing community that values digital privacy and anonymity. With ShadowSelf, you can take control of your online identity
    and experience the internet on your terms.
  </p>
  <p>
    Make sure to star us on <a href="https://github.com/RedeemedSpoon/ShadowSelf" rel="external">GitHub</a>, follow us on
    <a href="https://mastodon.social/@shadow_self" rel="external">Mastodon</a>
  </p>
</div>

<style lang="postcss">
  @reference "$style";

  div {
    @apply mx-auto my-[10rem] flex h-fit w-11/12 flex-col gap-6 md:w-3/4 xl:w-1/2;
  }

  h1 {
    @apply basic-style text-4xl md:text-5xl;
  }

  li {
    @apply mb-3 ml-6 list-disc;
  }
</style>
