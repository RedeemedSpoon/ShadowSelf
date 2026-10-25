<script lang="ts">
  import {API_BASE_URL, SERVICE_GUIDES} from '$constant';
  import {onMount, tick} from 'svelte';
  import {goto} from '$app/navigation';
  import Icon from '$component/ui/Icon.svelte';
  import ApiMethod from '$component/public/ApiMethod.svelte';
  import DocsSearch from '$component/public/DocsSearch.svelte';
  import CodeLanguageIcon from '$component/public/CodeLanguageIcon.svelte';
  import PublicPage from '$component/public/PublicPage.svelte';
  import {API_DOCUMENTATION} from '$lib/constants/api-documentation';

  const samples = {
    curl: `curl --fail-with-body ${API_BASE_URL}/auth/test \\\n  -H "Authorization: Bearer $SHADOWSELF_API_KEY"`,
    javascript: `const response = await fetch('${API_BASE_URL}/auth/test', {
  headers: { Authorization: \`Bearer \${process.env.SHADOWSELF_API_KEY}\` }
});

const body = await response.json();

if (!response.ok) {
  throw new Error(body.error.message);
}

console.log(body);`,
    python: `import json
import os
import urllib.request

request = urllib.request.Request(
    '${API_BASE_URL}/auth/test',
    headers={'Authorization': 'Bearer ' + os.environ['SHADOWSELF_API_KEY']}
)
with urllib.request.urlopen(request) as response:
    print(json.load(response))`,
  };
  const languages = [
    {id: 'curl', label: 'cURL'},
    {id: 'javascript', label: 'JavaScript'},
    {id: 'python', label: 'Python'},
  ] as const;
  let content: HTMLDivElement;
  let activeSection = $state('introduction');
  let scrollFrame = 0;
  let searchNavigation: AbortController | undefined;
  let language = $state<keyof typeof samples>('curl');
  let copied = $state(false);
  let copyError = $state('');

  function animateEndpoint(node: HTMLDetailsElement) {
    const summary = node.querySelector('summary')!;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation: Animation | undefined;
    let expanded = node.open;

    node.dataset.expanded = String(expanded);

    function finishTransition() {
      animation?.cancel();
      animation = undefined;
      node.open = expanded;
      node.dataset.expanded = String(expanded);
    }

    function toggle(event: MouseEvent) {
      event.preventDefault();

      const startHeight = node.getBoundingClientRect().height;

      animation?.cancel();
      expanded = !expanded;
      node.dataset.expanded = String(expanded);

      if (reducedMotion.matches) {
        finishTransition();

        return;
      }

      node.open = true;

      const endHeight = expanded ? node.getBoundingClientRect().height : summary.getBoundingClientRect().height;

      animation = node.animate({height: [`${startHeight}px`, `${endHeight}px`]}, {duration: 380, easing: 'ease'});
      animation.onfinish = finishTransition;
    }

    function open() {
      expanded = true;
      finishTransition();
    }

    summary.addEventListener('click', toggle);
    node.addEventListener('endpoint-open', open);
    reducedMotion.addEventListener('change', finishTransition);

    return {
      destroy() {
        animation?.cancel();
        summary.removeEventListener('click', toggle);
        node.removeEventListener('endpoint-open', open);
        reducedMotion.removeEventListener('change', finishTransition);
      },
    };
  }

  function highlightSearchResult(target: HTMLElement) {
    const elements = [target];

    if (target instanceof HTMLDetailsElement) {
      elements.push(...target.querySelectorAll<HTMLElement>('summary, p, .endpoint-example, pre'));
    }

    for (const element of elements) {
      const backgroundColor = getComputedStyle(element).backgroundColor;

      element.getAnimations().forEach((animation) => animation.cancel());
      element.animate(
        [
          {backgroundColor, boxShadow: 'inset 0 0 0 1px transparent'},
          {
            backgroundColor: 'color-mix(in srgb, var(--feature-accent, var(--accent)) 20%, transparent)',
            boxShadow:
              element === target
                ? 'inset 0 0 0 1px color-mix(in srgb, var(--feature-accent, var(--accent)) 50%, transparent)'
                : 'inset 0 0 0 1px transparent',
            offset: 0.45,
          },
          {backgroundColor, boxShadow: 'inset 0 0 0 1px transparent'},
        ],
        {duration: 550, iterations: 2, easing: 'ease-in-out'},
      );
    }
  }

  async function openSearchResult(sectionId: string, endpointId?: string) {
    await tick();

    const section = document.getElementById(sectionId);
    const target = endpointId ? document.getElementById(endpointId) : section?.querySelector('h2');

    if (!target) {
      return;
    }

    searchNavigation?.abort();
    searchNavigation = new AbortController();

    if (target instanceof HTMLDetailsElement) {
      target.dispatchEvent(new Event('endpoint-open'));
    }

    await goto(`#${endpointId || sectionId}`, {noScroll: true, keepFocus: true});

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollTarget = target instanceof HTMLDetailsElement ? (target.querySelector('summary') ?? target) : target;
    const bounds = scrollTarget.getBoundingClientRect();
    const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const destination = Math.max(
      0,
      Math.min(window.scrollY + bounds.top + bounds.height / 2 - window.innerHeight / 2, maximumScroll),
    );
    const willScroll = Math.abs(destination - window.scrollY) > 1;

    if (!reducedMotion && willScroll) {
      document.addEventListener('scrollend', () => highlightSearchResult(target), {
        once: true,
        signal: searchNavigation.signal,
      });
    }

    window.scrollTo({top: destination, behavior: reducedMotion ? 'instant' : 'smooth'});
    target.setAttribute('tabindex', '-1');
    target.focus({preventScroll: true});
    scheduleActiveSection();

    if (!reducedMotion && !willScroll) {
      highlightSearchResult(target);
    }
  }

  function updateActiveSection() {
    if (!content) {
      return;
    }

    if (window.scrollY <= 2) {
      activeSection = 'introduction';

      return;
    }

    const sections = [...content.querySelectorAll<HTMLElement>('section[id]')];
    const headerHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--public-header-height'),
    );
    const readingStart = headerHeight + 24;
    let current: HTMLElement | undefined = sections[0];

    for (const [index, section] of sections.entries()) {
      const heading = section.querySelector('h2');

      if (!heading) {
        continue;
      }

      const headingTop = heading.getBoundingClientRect().top;
      const previousHeading = sections[index - 1]?.querySelector('h2');
      const sectionSpacing = previousHeading
        ? headingTop - previousHeading.getBoundingClientRect().top
        : window.innerHeight;
      const threshold = Math.min(window.innerHeight * 0.55, readingStart + sectionSpacing * 0.6);

      if (headingTop <= threshold + 1) {
        current = section;
      }
    }

    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = sections.at(-1);
    }

    if (current) {
      activeSection = current.id;
    }
  }

  function scheduleActiveSection() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(updateActiveSection);
  }

  onMount(() => {
    window.addEventListener('scroll', scheduleActiveSection, {passive: true});
    window.addEventListener('resize', scheduleActiveSection);
    scheduleActiveSection();

    return () => {
      window.removeEventListener('scroll', scheduleActiveSection);
      window.removeEventListener('resize', scheduleActiveSection);
      cancelAnimationFrame(scrollFrame);
      searchNavigation?.abort();
    };
  });

  function endpointFeature(path: string) {
    if (path.includes('/vault')) {
      return 'vault';
    }

    if (path.includes('/mail')) {
      return 'email';
    }

    if (path.includes('/phone')) {
      return 'phone';
    }

    if (path.includes('/wallet')) {
      return 'wallet';
    }

    return 'identity';
  }

  async function copySample() {
    copied = false;
    copyError = '';

    try {
      await navigator.clipboard.writeText(samples[language]);
      copied = true;
    } catch {
      copyError = 'Copy failed. Select the code to copy it.';
    }
  }
</script>

<svelte:head
  ><title>API documentation | ShadowSelf</title><meta
    name="description"
    content="Use the ShadowSelf API to work with your identities and their tools from scripts and applications. Authentication, request examples, and service guides." /></svelte:head>

<PublicPage
  title="Product guides &amp; API reference"
  description="Work with your identities and their tools from your own scripts and applications."
  wide>
  {#snippet sidebar()}
    <nav class="docs-navigation" aria-label="Documentation sections">
      <DocsSearch onselect={openSearchResult} />
      <span class="navigation-label">Getting started</span>
      <a href="#introduction" aria-current={activeSection === 'introduction' ? 'location' : undefined}>
        <Icon name="info" size={15} />Introduction
      </a>
      <a href="#authentication" aria-current={activeSection === 'authentication' ? 'location' : undefined}
        ><Icon name="lock" size={15} />Authentication</a>
      <a href="#request-example" aria-current={activeSection === 'request-example' ? 'location' : undefined}
        ><Icon name="code" size={15} />Test your API key</a>
      <a href="#errors" aria-current={activeSection === 'errors' ? 'location' : undefined}
        ><Icon name="warning" size={15} />Errors &amp; retries</a>
      <a href="#security" aria-current={activeSection === 'security' ? 'location' : undefined}
        ><Icon name="shield" size={15} />Encryption &amp; availability</a>
      <span class="navigation-label">Services &amp; API</span>{#each API_DOCUMENTATION as group (group.id)}<a
          href={`#${group.id}`}
          aria-current={activeSection === group.id ? 'location' : undefined}
          data-feature={group.feature}><Icon name={group.icon} size={15} />{group.title}</a
        >{/each}
    </nav>
  {/snippet}
  <div class="docs-content" bind:this={content}>
    <section id="introduction">
      <h2 class="section-title"><Icon name="code" size={21} />Use ShadowSelf from your own code</h2>
      <p>
        An API lets a script or application work with a service by sending requests to it. The ShadowSelf API gives you
        another way to use your identities and their tools, alongside the dashboard and browser extension. You can read
        messages, manage saved logins, or build a client around your own workflow.
      </p>
      <p>
        Send HTTP requests to <code>{API_BASE_URL}</code>. Each endpoint below describes an operation, the fields it
        accepts, and the response it returns. Requests and responses use JSON. Methods such as <code>GET</code> read
        data, while <code>POST</code>, <code>PATCH</code>, <code>PUT</code>, and <code>DELETE</code> make changes. Your API
        key limits access to your own account and identities.
      </p>
      <aside class="usage-note" aria-label="Considerate API use">
        <Icon name="warning" size={19} />
        <div>
          <h3>Please be considerate with requests</h3>
          <p>
            Avoid tight polling loops, duplicate calls, and immediate retries. Use WebSocket events for live messages
            instead of repeatedly checking for updates. Aggressive traffic may be rate-limited. If you receive
            <code>429 Too Many Requests</code>, pause and increase the delay before trying again.
          </p>
        </div>
      </aside>
    </section>
    <section id="authentication">
      <h2 class="section-title"><Icon name="lock" size={21} />Authenticate each request</h2>
      <p>
        Enable API access in account settings and generate an API key. Send it in
        <code>Authorization: Bearer &lt;key&gt;</code> with each request. The key is shown once, so save it securely.
      </p>
      <p>
        Keep API keys out of URLs, browser storage, screenshots, and source control. Identity operations require
        ownership, and active services require a ready identity. Revoke a key in account settings if it is exposed.
      </p>
    </section>
    <section id="request-example">
      <h2 class="section-title"><Icon name="code" size={21} />Test your API key</h2>
      <p>
        Set <code>SHADOWSELF_API_KEY</code> in your client environment, then make a <code>GET</code> request to
        <code>/api/auth/test</code>. This checks your key without changing identity data.
      </p>
      <div class="code-window" id="request-example-endpoint-0">
        <div class="code-toolbar">
          <div aria-label="Example language">
            {#each languages as item (item.id)}<button
                type="button"
                data-language={item.id}
                aria-pressed={language === item.id}
                onclick={() => {
                  language = item.id;
                  copied = false;
                  copyError = '';
                }}><CodeLanguageIcon language={item.id} />{item.label}</button
              >{/each}
          </div>
          <button type="button" class="copy-button" onclick={copySample}
            ><Icon name={copied ? 'check' : 'copy'} size={14} />{copied ? 'Copied' : 'Copy'}</button>
        </div>
        <pre><code>{samples[language]}</code></pre>
      </div>
      {#if copyError}<p class="copy-error" role="status">{copyError}</p>{/if}
      <p class="code-note">
        A valid key returns <code>200 OK</code> with <code>{'{"authenticated":true}'}</code>. If access is denied, check
        that API access is enabled in settings and that the full key follows <code>Bearer</code> with a space.
      </p>
    </section>
    <section id="errors">
      <h2 class="section-title"><Icon name="warning" size={21} />Handle failure before retrying</h2>
      <p>
        Errors use the HTTP status and a consistent JSON body. Read <code>error.code</code> for the machine-readable
        reason and <code>error.message</code> for the explanation.
      </p>
      <pre class="error-example"><code
          >{JSON.stringify(
            {error: {code: 'unauthenticated', message: 'Authentication required'}},
            null,
            2,
          )}</code></pre>
      <div class="status-list">
        <div>
          <code class="status-code">400</code><span>Invalid request. Correct the input before retrying.</span>
        </div>
        <div>
          <code class="status-code">401 / 403</code><span
            >Authentication or access denied. Check the credential and ownership.</span>
        </div>
        <div>
          <code class="status-code">404</code><span>The record is missing or is not available to your account.</span>
        </div>
        <div>
          <code class="status-code">409</code><span
            >The state changed or request details conflict. Reload and resolve the conflict.</span>
        </div>
        <div>
          <code class="status-code">429</code><span>A rate limit applies. Wait before trying again.</span>
        </div>
        <div>
          <code class="status-code">503</code><span
            >A provider is unavailable or an operation needs reconciliation.</span>
        </div>
      </div>
      <p>
        Use a stable UUID <code>requestID</code> for each swap. Retry the same operation with the same ID and input. If a
        response asks for reconciliation, inspect the current state before starting another swap.
      </p>
      <p>
        Vault mutations require the current <code>vaultRevision</code>. A 409 response means your snapshot is stale.
        Reload before editing or rotating encryption. A 202 deletion response means provider cleanup remains pending. A
        410 response means a payment quote expired. A 502 response means a provider returned invalid data or rejected
        the operation.
      </p>
    </section>
    <section id="security">
      <h2 class="section-title"><Icon name="shield" size={21} />Encryption and service availability</h2>
      <p>
        Encrypt vault passwords, TOTP secrets, and wallet private material in the client before sending them. Read
        operations return the encrypted values. The API does not accept your master password as a way to unlock the
        vault.
      </p>
      <p>
        Derive a 256-bit AES-GCM key with PBKDF2, SHA-256, 600,000 iterations, and the UTF-8 identity ID as the salt.
        Each encrypted value uses a fresh 12-byte IV. Its wire format is <code>v1.</code> followed by base64 of the IV and
        ciphertext, including the 16-byte authentication tag. Account sign-in passwords and account two-factor enrollment
        are separate from these encrypted identity secrets.
      </p>
      <p>
        Creation uses a persistent named draft and ordinary REST calls. Save draft fields through
        <span class="inline-endpoint"><ApiMethod method="PUT" /><code>/identities/:id/creation</code></span>, then
        provision the validated draft. Portrait generation, email, phone, billing, and wallet operations depend on their
        configured providers. Names and biographies are generated locally.
      </p>
      <div class="policy-note">
        <p>
          Residential routing uses the selected identity's connection settings. Check the exit IP before browsing. An
          exit location does not change cookies or browser fingerprints. Virtual cards, residential proxies, and the
          online drive each stay attached to their identity. Crypto billing is separate from identity wallets.
        </p>
      </div>
    </section>
    {#each API_DOCUMENTATION as group (group.id)}<section
        id={group.id}
        class="endpoint-group"
        data-feature={group.feature}>
        <h2 class="section-title">
          <Icon name={group.icon} size={22} />{group.title}<span>{group.endpoints.length}</span>
        </h2>
        {#if group.id === 'websockets'}
          <p>
            Connect to receive live identity events. The connection authenticates your credentials and periodically
            rechecks access. Send <code>ping</code> to receive <code>pong</code>. After reconnecting, fetch the current
            mailbox and conversations to recover events missed while disconnected.
          </p>
        {/if}
        {#if group.guide}
          {@const guide = SERVICE_GUIDES[group.guide]}
          <div class="service-guide">
            <p>{guide.introduction}</p>
            <dl>
              {#each guide.tools as tool (tool.name)}
                <div>
                  <dt>{tool.name}</dt>
                  <dd>{tool.description}</dd>
                </div>
              {/each}
            </dl>
            <p class="guide-note">{guide.note}</p>
          </div>
        {/if}
        {#if group.endpoints.length}<div class="endpoints">
            {#each group.endpoints as endpoint, index (`${endpoint.method}-${endpoint.path}`)}<details
                id={`${group.id}-endpoint-${index}`}
                use:animateEndpoint
                data-feature={endpointFeature(endpoint.path)}>
                <summary
                  ><ApiMethod method={endpoint.method} /><code>{endpoint.path}</code><span
                    class="expand"
                    aria-hidden="true">+</span
                  ></summary>
                <p>{endpoint.detail}</p>
                {#if endpoint.query}<div class="endpoint-example">
                    <h3>Query example</h3>
                    <pre><code>{endpoint.query}</code></pre>
                  </div>{/if}
                {#if endpoint.request}<div class="endpoint-example">
                    <h3>JSON request</h3>
                    <pre><code>{JSON.stringify(endpoint.request, null, 2)}</code></pre>
                  </div>{/if}
                {#if endpoint.response}<div class="endpoint-example">
                    <h3>Success response example</h3>
                    <pre><code>{JSON.stringify(endpoint.response, null, 2)}</code></pre>
                  </div>{/if}
              </details>{/each}
          </div>{/if}
      </section>{/each}
    <p class="docs-footnote">
      Path parameters such as <code>:id</code> must be replaced with the owned record's ID. Fields ending in
      <code>?</code>
      are optional. Do not send plaintext secrets in place of encrypted fields. Example tokens, provider references, and values
      in angle brackets must be replaced with your own results. Ciphertext examples describe the required format and are not
      usable encrypted secrets. JSON requests require
      <code>Content-Type: application/json</code>. Unless a route says otherwise, a successful request returns HTTP 200.
      <a href="/contact">Report a documentation issue</a>.
    </p>
  </div>
</PublicPage>

<style>
  .usage-note {
    display: flex;
    align-items: start;
    gap: 13px;
    padding: 20px;
    margin-block: 25px 32px;
    border-left: 2px solid var(--feature-vault);
    border-radius: 0 7px 7px 0;
    background: color-mix(in srgb, var(--feature-vault) 4%, transparent);
  }
  .usage-note > :global(svg) {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--feature-vault);
  }
  .usage-note h3 {
    margin: 0 0 9px;
    font-size: 13px;
    font-weight: 500;
    color: #d8cda9;
  }
  .usage-note p {
    margin: 0;
    color: var(--muted);
  }
  .service-guide {
    margin-block: 22px;
  }
  .service-guide dl {
    margin: 22px 0;
  }
  .service-guide dl > div {
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
  }
  .service-guide dt {
    color: var(--feature-accent);
    font-size: 12px;
    margin-bottom: 7px;
  }
  .service-guide dd {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.8;
  }
  .guide-note {
    padding-left: 14px;
    border-left: 2px solid var(--feature-accent);
  }
  .docs-navigation {
    display: grid;
    gap: 4px;
    padding-right: 20px;
    border-right: 1px solid color-mix(in srgb, var(--accent-light) 12.55%, transparent);
  }
  .navigation-label {
    color: #667796;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0 0 10px;
  }
  .navigation-label:not(:first-of-type) {
    margin-top: 16px;
    padding-top: 20px;
    border-top: 1px solid color-mix(in srgb, var(--accent-light) 12.55%, transparent);
  }
  .docs-navigation a {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 11px;
    line-height: 1.7;
    padding: 9px 10px;
    border-radius: 5px;
    text-decoration: none;
    color: #94a3c2;
  }
  .docs-navigation a:is(:hover, :focus-visible, [aria-current='location']) {
    color: #dce3f7;
    background: var(--neutral-hover);
  }
  .docs-navigation a:active {
    color: #e6ebff;
    background: var(--neutral-pressed);
  }
  .docs-navigation a[data-feature] :global(svg) {
    color: var(--feature-accent);
    flex-shrink: 0;
  }
  .docs-navigation a:not([data-feature]) :global(svg) {
    color: #94a3c2;
    flex-shrink: 0;
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .section-title :global(svg) {
    flex-shrink: 0;
    color: var(--accent-light);
  }
  .endpoint-group .section-title :global(svg) {
    color: var(--feature-accent);
  }
  .endpoint-group {
    padding-top: 28px;
    margin-top: 42px;
    border-top: 1px solid color-mix(in srgb, var(--accent-light) 14.51%, transparent);
  }
  .endpoint-group h2 {
    margin-top: 0;
  }
  .docs-content {
    min-width: 0;
  }
  .docs-content > section:first-child h2 {
    margin-top: 0;
  }
  .docs-content p {
    font-size: 13px;
  }
  code {
    font:
      11px 'Fira Code Variable',
      monospace;
    color: #bdd4ef;
    overflow-wrap: anywhere;
  }
  p code {
    padding: 2px 4px;
    background: color-mix(in srgb, var(--accent-light) 4.71%, transparent);
    border-radius: 3px;
  }
  pre {
    overflow-x: auto;
    margin: 0;
    padding: 25px;
    line-height: 1.8;
    background: #0a1020;
    tab-size: 2;
  }
  pre code {
    overflow-wrap: normal;
    white-space: pre;
  }
  .code-window {
    border: 1px solid color-mix(in srgb, var(--accent-light) 18.82%, transparent);
    border-radius: 8px;
    overflow: hidden;
  }
  .code-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: #151c33;
  }
  .code-toolbar > div {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 1px solid transparent;
    background: transparent;
    color: #9eacc9;
    font-size: 10px;
    border-radius: 5px;
    padding: 8px 10px;
    cursor: pointer;
    box-shadow: none;
  }
  button:hover {
    color: #e0e7ff;
  }
  button[data-language='curl'] {
    --language-color: var(--success-color);
  }
  button[data-language='python'] {
    --language-color: #60a5fa;
  }
  button[data-language='javascript'] {
    --language-color: #facc15;
  }
  button[data-language] {
    color: var(--language-color);
  }
  button[data-language][aria-pressed='true'] {
    border-color: color-mix(in srgb, var(--language-color) 45%, transparent);
    background: color-mix(in srgb, var(--language-color) 12%, transparent);
  }
  .copy-button {
    flex-shrink: 0;
  }
  .copy-button :global(svg) {
    color: currentColor;
  }
  .code-note {
    margin-top: 18px !important;
    font-size: 12px !important;
  }
  .copy-error {
    color: #fbbf24;
    font-size: 11px !important;
    margin-top: 10px !important;
  }
  .error-example {
    border: 1px solid color-mix(in srgb, var(--accent-light) 14.51%, transparent);
    border-radius: 7px;
  }
  .status-list {
    display: grid;
    gap: 0;
    margin-block: 25px;
  }
  .status-list > div {
    display: grid;
    grid-template-columns: 85px 1fr;
    gap: 15px;
    border-bottom: 1px solid color-mix(in srgb, var(--accent-light) 7.84%, transparent);
    padding: 12px 0;
    font-size: 12px;
    line-height: 1.7;
  }
  .endpoints details[data-feature] {
    border-left: 2px solid var(--feature-accent);
  }
  .endpoint-group h2 {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  .endpoint-group h2 > span {
    font:
      11px 'Fira Code Variable',
      monospace;
    color: var(--feature-accent);
    border: 1px solid color-mix(in srgb, var(--feature-accent) 20%, transparent);
    background: color-mix(in srgb, var(--feature-accent) 8%, transparent);
    padding: 4px 7px;
    border-radius: 4px;
  }
  .endpoints {
    border: 1px solid color-mix(in srgb, var(--accent-light) 14.51%, transparent);
    border-radius: 8px;
    overflow: hidden;
  }
  .endpoints details {
    overflow: hidden;
  }
  details + details {
    border-top: 1px solid color-mix(in srgb, var(--accent-light) 9.41%, transparent);
  }
  summary {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr) 15px;
    align-items: start;
    gap: 12px;
    list-style: none;
    padding: 17px;
    cursor: pointer;
    background: color-mix(in srgb, var(--accent-light) 1.57%, transparent);
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary code {
    font-size: 10px;
    padding-top: 2px;
    line-height: 1.7;
  }
  .inline-endpoint {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-inline: 4px;
    vertical-align: middle;
  }
  .status-code {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: start;
    width: fit-content;
    min-width: 54px;
    min-height: 24px;
    padding: 4px 7px;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--danger-color);
    background: color-mix(in srgb, var(--danger-color) 11%, transparent);
    font:
      600 10px 'Fira Code Variable',
      monospace;
    line-height: 1.2;
    white-space: nowrap;
  }
  .expand {
    color: var(--accent);
    font-size: 16px;
    transition: transform 180ms ease;
  }
  details:global([data-expanded='true']) .expand {
    transform: rotate(45deg);
  }
  details > p {
    margin: 0 !important;
    padding: 18px;
    background: #090f2090;
    font:
      11px 'Fira Code Variable',
      monospace;
    overflow-wrap: anywhere;
  }
  .endpoint-example {
    padding: 0 18px 18px;
    background: #090f2090;
  }
  .endpoint-example h3 {
    margin: 0 0 10px;
    font-size: 10px;
    font-weight: 500;
    color: #97a8c6;
  }
  .endpoint-example pre {
    border: 1px solid color-mix(in srgb, var(--accent-light) 9.41%, transparent);
    border-radius: 5px;
    padding: 14px;
  }
  .docs-footnote {
    margin-top: 35px !important;
    color: #8d9cba;
    font-size: 12px !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .expand {
      transition: none;
    }
  }
  @media (max-width: 900px) {
    .docs-navigation {
      position: static;
      max-height: none;
      border-right: 0;
      padding-right: 0;
      display: flex;
      gap: 8px 18px;
      flex-wrap: wrap;
      padding-bottom: 22px;
    }
    .docs-navigation a {
      padding-block: 4px;
    }
    .navigation-label {
      width: 100%;
      padding-bottom: 2px;
    }
    .navigation-label:not(:first-of-type) {
      margin-top: 8px;
      padding-top: 12px;
    }
  }
  @media (max-width: 500px) {
    .code-toolbar {
      align-items: flex-start;
    }
    .code-toolbar button {
      padding: 7px 6px;
      font-size: 9px;
      gap: 5px;
    }
    .status-list > div {
      grid-template-columns: 78px minmax(0, 1fr);
      gap: 12px;
    }
    .section-title {
      align-items: flex-start;
    }
    .section-title :global(svg) {
      margin-top: 4px;
    }
    pre {
      padding: 18px;
    }
    summary {
      gap: 8px;
      padding: 15px 12px;
    }
    summary code {
      font-size: 9px;
    }
  }
</style>
