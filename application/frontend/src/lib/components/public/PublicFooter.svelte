<script lang="ts">
  import logo from '$image/brands/shadowself/logo-beside-text.svg';
  import github from '$image/brands/github.svg';
  import mastodon from '$image/brands/mastodon.svg';
  import tor from '$image/brands/tor.svg';
  import {ONION_URL} from '$constant';

  const categories = [
    {
      title: 'Product',
      links: [
        ['Homepage', '/'],
        ['Extension', '/extension'],
        ['Purchase', '/purchase'],
      ],
    },
    {
      title: 'Account',
      links: [
        ['Dashboard', '/dashboard'],
        ['Settings', '/settings'],
        ['Docs', '/docs'],
      ],
    },
    {
      title: 'Support',
      links: [
        ['Contact', '/contact'],
        ['About', '/about'],
        ['FAQ', '/faq'],
      ],
    },
    {
      title: 'Legal',
      links: [
        ['Terms of Service', '/terms-of-service'],
        ['Privacy Policy', '/privacy-policy'],
        ['Refund Policy', '/refund-policy'],
      ],
    },
  ];
  const socialLinks = [
    {label: 'GitHub', href: 'https://github.com/RedeemedSpoon/ShadowSelf', image: github},
    {label: 'Mastodon', href: 'https://mastodon.social/@shadow_self', image: mastodon},
    {label: 'Onion service', href: ONION_URL, image: tor},
  ];
</script>

<footer class="public-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <a href="/" aria-label="ShadowSelf home"
        ><img class="wordmark" src={logo} alt="ShadowSelf" width="176" height="40" /></a>
      <div class="social-links">
        {#each socialLinks as link (link.label)}<a href={link.href} aria-label={link.label} rel="noreferrer"
            ><img src={link.image} alt="" width="20" height="20" /></a
          >{/each}
      </div>
    </div>
    <div class="footer-navigation">
      {#each categories as category (category.title)}<nav aria-label={category.title}>
          <h2>{category.title}</h2>
          {#each category.links as [label, href] (href)}<a {href}>{label}</a>{/each}
        </nav>{/each}
    </div>
  </div>
  <div class="footer-bottom">
    © {new Date().getFullYear()} ShadowSelf <span aria-hidden="true">·</span> Your privacy, our priority.
  </div>
</footer>

<style>
  .public-footer {
    flex-shrink: 0;
    border-top: 1px solid color-mix(in srgb, var(--accent-light) 12.55%, transparent);
    background: #070c18;
    padding: 48px 0 24px;
    color: #9caac6;
  }
  .footer-inner,
  .footer-bottom {
    width: min(1240px, calc(100% - 80px));
    margin-inline: auto;
  }
  .footer-inner {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 72px;
    align-items: start;
  }
  .wordmark {
    display: block;
    width: 176px;
    height: auto;
  }
  .social-links {
    display: flex;
    gap: 8px;
    margin-top: 22px;
  }
  .social-links a {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    opacity: 0.7;
  }
  .social-links a:hover {
    background: color-mix(in srgb, var(--accent-light) 4.71%, transparent);
    opacity: 1;
  }
  .social-links img {
    display: block;
  }
  .footer-navigation {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 32px;
  }
  nav {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  h2 {
    margin: 0 0 5px;
    color: #d0d8eb;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.5;
  }
  a {
    color: inherit;
    font-size: 13px;
    line-height: 1.5;
    text-decoration: none;
  }
  a:hover {
    color: #e2dcff;
  }
  .footer-bottom {
    margin-top: 36px;
    padding-top: 20px;
    color: #71809e;
    font-size: 11px;
    text-align: center;
  }
  a:focus-visible {
    outline: 2px solid var(--accent-light);
    outline-offset: 5px;
  }
  @media (max-width: 1050px) {
    .footer-inner {
      grid-template-columns: 1fr;
      gap: 32px;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .social-links {
      margin-top: 0;
    }
  }
  @media (max-width: 600px) {
    .public-footer {
      padding-top: 32px;
    }
    .footer-inner,
    .footer-bottom {
      width: calc(100% - 40px);
    }
    .footer-navigation {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 32px 24px;
    }
    .wordmark {
      width: 150px;
    }
    .social-links {
      gap: 0;
    }
  }
</style>
