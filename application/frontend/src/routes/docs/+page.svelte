<script lang="ts">
  import {APP_ORIGIN} from '$constant';
  import {tick} from 'svelte';
  import {goto} from '$app/navigation';
  import Icon from '$component/ui/Icon.svelte';
  import CodeLanguageIcon from '$component/public/CodeLanguageIcon.svelte';
  import PublicPage from '$component/public/PublicPage.svelte';
  import {API_DOCUMENTATION} from '$lib/constants/api-documentation';

  const samples = {
    curl: `curl --fail-with-body ${APP_ORIGIN}/api/identities \\\n  -H "Authorization: Bearer $SHADOWSELF_TOKEN"`,
    javascript: `const response = await fetch('${APP_ORIGIN}/api/identities', {
  headers: { Authorization: \`Bearer \${process.env.SHADOWSELF_TOKEN}\` }
});
const body = await response.json();
if (!response.ok) {
  throw new Error(body.error.message);
}
console.log(body.identities);`,
    python: `import json
import os
import urllib.request

request = urllib.request.Request(
    '${APP_ORIGIN}/api/identities',
    headers={'Authorization': 'Bearer ' + os.environ['SHADOWSELF_TOKEN']}
)
with urllib.request.urlopen(request) as response:
    print(json.load(response)['identities'])`,
  };
  const languages = [
    {id: 'curl', label: 'cURL'},
    {id: 'javascript', label: 'JavaScript'},
    {id: 'python', label: 'Python'},
  ] as const;
  let language = $state<keyof typeof samples>('curl');
  let query = $state('');
  let copied = $state(false);
  let copyError = $state('');
  let groups = $derived(
    API_DOCUMENTATION.map((group) => ({
      ...group,
      endpoints: group.endpoints.filter((endpoint) =>
        `${endpoint.method} ${endpoint.path} ${endpoint.detail}`.toLowerCase().includes(query.toLowerCase().trim()),
      ),
    })).filter((group) => group.endpoints.length),
  );

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

    if (path.includes('/billing')) {
      return 'card';
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
    content="The ShadowSelf API contract for authentication, identities, creation, vaults, messaging, wallets, and billing." /></svelte:head>

<PublicPage title="API reference" description="REST endpoints under /api. JSON requests and responses." wide>
  {#snippet sidebar()}
    <nav class="docs-navigation" aria-label="Documentation sections">
      <span class="navigation-label">Getting started</span>
      <a href="#authentication"><Icon name="lock" size={15} />Authentication</a>
      <a href="#request-example"><Icon name="code" size={15} />Request example</a>
      <a href="#errors"><Icon name="warning" size={15} />Errors &amp; retries</a>
      <a href="#security"><Icon name="shield" size={15} />Encryption &amp; availability</a>
      <span class="navigation-label">Endpoints</span>{#each API_DOCUMENTATION as group (group.id)}<a
          href={`#${group.id}`}
          data-feature={group.feature}
          onclick={async (event) => {
            if (!query) {
              return;
            }
            event.preventDefault();
            query = '';
            await tick();
            await goto(`#${group.id}`);
          }}><Icon name={group.icon} size={15} />{group.title}</a
        >{/each}
    </nav>
  {/snippet}
  <div class="docs-content">
    <section id="authentication">
      <h2 class="section-title"><Icon name="lock" size={21} />Authenticate each request</h2>
      <p>
        Send a session token or enabled API key in <code>Authorization: Bearer &lt;token&gt;</code>. Sign in through
        <code><span class="method" data-method="POST">POST</span> /auth/password</code>
        or the email flow. A completed login returns <code>{'{token}'}</code>; an account with two-factor authentication
        first returns
        <code>{'{challenge,expiresIn}'}</code>.
      </p>
      <p>
        Complete the challenge through <code>/auth/second-factor</code> or <code>/auth/recovery</code>. Generate an API
        key in account settings after enabling API access. The new key is shown once. Keep tokens out of URLs, browser
        storage, screenshots, and source control.
      </p>
      <p>
        The website uses a secure HTTP-only session cookie. Requests from a separate API client use the bearer header.
        Identity operations require ownership, and active services require a ready identity.
      </p>
    </section>
    <section id="request-example">
      <h2 class="section-title"><Icon name="code" size={21} />List your identities</h2>
      <p>Set <code>SHADOWSELF_TOKEN</code> in your client environment.</p>
      <div class="code-window">
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
        Success returns <code>{'{identities:[...]}'}</code>. Each identity includes an explicit status. An unavailable
        service is not represented as a successful empty result.
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
          <code class="status-code" data-status="400">400</code><span
            >Invalid request. Correct the input before retrying.</span>
        </div>
        <div>
          <code class="status-code" data-status="401">401 / 403</code><span
            >Authentication or access denied. Check the credential and ownership.</span>
        </div>
        <div>
          <code class="status-code" data-status="404">404</code><span
            >The record is missing or is not available to your account.</span>
        </div>
        <div>
          <code class="status-code" data-status="409">409</code><span
            >The state changed or request details conflict. Reload and resolve the conflict.</span>
        </div>
        <div>
          <code class="status-code" data-status="429">429</code><span
            >A rate limit applies. Wait before trying again.</span>
        </div>
        <div>
          <code class="status-code" data-status="503">503</code><span
            >A provider is unavailable or an operation needs reconciliation.</span>
        </div>
      </div>
      <p>
        Use a stable UUID <code>requestID</code> for each purchase, renewal, or swap. Retry the same operation with the same
        ID and input. A response that asks for reconciliation means you should inspect the current state before starting another
        payment.
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
        Creation uses a persistent named draft and ordinary REST calls. Save draft fields through <code
          ><span class="method" data-method="PUT">PUT</span> /identities/:id/creation</code
        >, then provision the validated draft. Portrait generation, email, phone, billing, and wallet operations depend
        on their configured providers. Names and biographies are generated locally.
      </p>
      <div class="policy-note">
        <p>
          Network routing is unavailable. <code><span class="method" data-method="GET">GET</span> /extension</code>
          returns
          <code>network.status = 'unavailable'</code>. No proxy activation or device VPN endpoint exists. Crypto billing
          can be disabled independently of user wallets.
        </p>
      </div>
      <p>
        WebSocket event routes authenticate the connection and periodically recheck it. They support <code>ping</code>
        and <code>pong</code>. Reconnect with valid credentials and fetch current state after a disconnect.
      </p>
    </section>
    <div class="endpoint-search">
      <label for="endpoint-search">Find an endpoint</label><input
        id="endpoint-search"
        type="search"
        placeholder="Search path, method, or payload"
        bind:value={query} />
    </div>
    {#if !groups.length}<p class="empty-results" role="status">No endpoints match "{query}".</p>{/if}
    {#each groups as group (group.id)}<section id={group.id} class="endpoint-group" data-feature={group.feature}>
        <h2 class="section-title">
          <Icon name={group.icon} size={22} />{group.title}<span>{group.endpoints.length}</span>
        </h2>
        <div class="endpoints">
          {#each group.endpoints as endpoint (`${endpoint.method}-${endpoint.path}`)}<details
              data-feature={endpointFeature(endpoint.path)}>
              <summary
                ><span class="method" data-method={endpoint.method}>{endpoint.method}</span><code>{endpoint.path}</code
                ><span class="expand" aria-hidden="true">+</span></summary>
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
        </div>
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
  .navigation-label:not(:first-child) {
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
    padding: 9px 0;
    text-decoration: none;
    color: #94a3c2;
  }
  .docs-navigation a:hover {
    color: var(--accent-light);
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
    --language-color: #4ade80;
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
  .endpoint-search {
    padding: 25px;
    background: #111a30;
    border: 1px solid color-mix(in srgb, var(--accent-light) 14.51%, transparent);
    border-radius: 8px;
    margin-top: 40px;
  }
  .endpoint-search label {
    display: block;
    font-size: 12px;
    color: #c2cce5;
    margin-bottom: 12px;
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
    color: var(--accent);
    border: 1px solid color-mix(in srgb, var(--accent-light) 14.51%, transparent);
    padding: 4px 7px;
    border-radius: 4px;
  }
  .endpoints {
    border: 1px solid color-mix(in srgb, var(--accent-light) 14.51%, transparent);
    border-radius: 8px;
    overflow: hidden;
  }
  details + details {
    border-top: 1px solid color-mix(in srgb, var(--accent-light) 9.41%, transparent);
  }
  summary {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) 15px;
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
  .method {
    display: inline-block;
    color: #0a1020;
    background: var(--method-color);
    font:
      700 10px 'Fira Code Variable',
      monospace;
    padding: 4px 6px;
    text-align: center;
    border-radius: 4px;
  }
  [data-method='GET'] {
    --method-color: #4ade80;
  }
  [data-method='POST'] {
    --method-color: #60a5fa;
  }
  [data-method='PUT'] {
    --method-color: #fbbf24;
  }
  [data-method='PATCH'] {
    --method-color: #c084fc;
  }
  [data-method='DELETE'] {
    --method-color: #fb7185;
  }
  [data-method='WS'] {
    --method-color: #22d3ee;
  }
  .status-code {
    align-self: start;
    width: fit-content;
    color: #0a1020;
    background: var(--status-color);
    font-weight: 700;
    font-size: 10px;
    padding: 4px 7px;
    border-radius: 4px;
    white-space: nowrap;
  }
  [data-status='400'] {
    --status-color: #fbbf24;
  }
  [data-status='401'] {
    --status-color: #fb7185;
  }
  [data-status='404'] {
    --status-color: #94a3b8;
  }
  [data-status='409'] {
    --status-color: #fb923c;
  }
  [data-status='429'] {
    --status-color: #c084fc;
  }
  [data-status='503'] {
    --status-color: #f472b6;
  }
  .expand {
    color: var(--accent);
    font-size: 16px;
  }
  details[open] .expand {
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
  .empty-results {
    padding: 25px 0;
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
    .navigation-label:not(:first-child) {
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
    .endpoint-search {
      padding: 18px;
    }
  }
</style>
