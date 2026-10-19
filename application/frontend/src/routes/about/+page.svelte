<script lang="ts">
  import PublicPage from '$component/public/PublicPage.svelte';
  import systemDesign from '$image/visuals/system-design.webp';
</script>

<svelte:head>
  <title>About | ShadowSelf</title>
  <meta
    name="description"
    content="The developer, purpose, and engineering behind ShadowSelf, an open-source project for separate online identities." />
</svelte:head>

<PublicPage
  title="About ShadowSelf"
  description="An independent project for people who want a private life online."
  wide>
  <div class="about-copy">
    <h2>Who's building this?</h2>
    <p>
      ShadowSelf is built and maintained by one developer, with contributions welcome. No venture funding, no
      advertising business. Paid identities cover the infrastructure, provider bills, and work needed to keep the
      project running.
    </p>
    <h2>Why this project exists</h2>
    <p>
      Signing up for a forum shouldn't require handing over the same name, email address, and phone number you use
      everywhere else. A pseudonym is useful, but it needs an inbox, a way to recover accounts, and somewhere to keep
      its credentials. Otherwise, you end up connecting it back to your personal life.
    </p>
    <p>
      ShadowSelf started as a way to put those pieces together. The aim is practical: make a separate identity something
      you can actually keep using, rather than a disposable name you forget after registration.
    </p>
    <h2>Built in the open</h2>
    <p>
      The website, API, and browser extension live in the same <a
        href="https://github.com/RedeemedSpoon/ShadowSelf"
        rel="noreferrer">public repository</a
      >. You can inspect the implementation, run your own instance, or change it under the AGPL-3.0 license. The
      <a href="/docs">API reference</a> documents how clients talk to the service.
    </p>
  </div>
  <figure>
    <a href={systemDesign} target="_blank" rel="noreferrer" aria-label="Open the original system design at full size">
      <img
        src={systemDesign}
        alt="Original ShadowSelf system design connecting the browser, website, extension, backend, database, and external providers."
        loading="lazy" />
    </a>
    <figcaption>The original system design, February 2026. Open the image for a closer look.</figcaption>
  </figure>
  <div class="about-copy">
    <h2>A small project with real costs</h2>
    <p>
      Phone numbers, message delivery, storage, and hosting cost money even when nobody is using them. Subscriptions pay
      for that ongoing work. They also keep the project independent of selling ads or access to your data.
    </p>
    <h2>Help shape it</h2>
    <p>
      Found a rough edge? <a href="/contact">Tell me what happened</a>. Have a fix? Open a pull request. Clear bug
      reports, code reviews, and provider research all help. Follow the project on
      <a href="https://mastodon.social/@shadow_self" rel="noreferrer">Mastodon</a> or star it on GitHub to keep it within
      reach.
    </p>
  </div>
</PublicPage>

<style>
  .about-copy {
    max-width: 780px;
    margin-inline: auto;
  }
  .about-copy:first-child h2:first-child {
    margin-top: 0;
  }
  figure {
    margin: 45px 0;
  }
  figure img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 10px;
  }
  figcaption {
    text-align: center;
    margin-top: 14px;
    color: #8f9dbb;
    font-size: 12px;
    line-height: 1.7;
  }
</style>
