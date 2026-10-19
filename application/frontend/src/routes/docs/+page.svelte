<script lang="ts">
  import {APP_ORIGIN} from '$constant';
  import {tick} from 'svelte';
  import {goto} from '$app/navigation';
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

<PublicPage
  eyebrow="API"
  title="API reference"
  description="REST endpoints under /api. JSON requests and responses."
  wide>
  <div class="docs-layout">
    <nav class="docs-navigation" aria-label="Documentation sections">
      <a href="#authentication">Authentication</a><a href="#request-example">Request example</a><a href="#errors"
        >Errors &amp; retries</a
      ><a href="#security">Encryption &amp; availability</a>{#each API_DOCUMENTATION as group (group.id)}<a
          href={`#${group.id}`}
          onclick={async (event) => {
            if (!query) {
              return;
            }
            event.preventDefault();
            query = '';
            await tick();
            await goto(`#${group.id}`);
          }}>{group.title}</a
        >{/each}
    </nav>
    <div class="docs-content">
      <section id="authentication">
        <h2>Authenticate each request</h2>
        <p>
          Send a session token or enabled API key in <code>Authorization: Bearer &lt;token&gt;</code>. Sign in through
          <code>POST /auth/password</code>
          or the email flow. A completed login returns <code>{'{token}'}</code>; an account with two-factor
          authentication first returns
          <code>{'{challenge,expiresIn}'}</code>.
        </p>
        <p>
          Complete the challenge through <code>/auth/second-factor</code> or <code>/auth/recovery</code>. Generate an
          API key in account settings after enabling API access. The new key is shown once. Keep tokens out of URLs,
          browser storage, screenshots, and source control.
        </p>
        <p>
          The website uses a secure HTTP-only session cookie. Requests from a separate API client use the bearer header.
          Identity operations require ownership, and active services require a ready identity.
        </p>
      </section>
      <section id="request-example">
        <h2>List your identities</h2>
        <p>Set <code>SHADOWSELF_TOKEN</code> in your client environment.</p>
        <div class="code-window">
          <div class="code-toolbar">
            <div aria-label="Example language">
              {#each languages as item (item.id)}<button
                  type="button"
                  aria-pressed={language === item.id}
                  onclick={() => {
                    language = item.id;
                    copied = false;
                    copyError = '';
                  }}>{item.label}</button
                >{/each}
            </div>
            <button type="button" onclick={copySample}>{copied ? 'Copied' : 'Copy'}</button>
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
        <h2>Handle failure before retrying</h2>
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
          <div><code>400</code><span>Invalid request. Correct the input before retrying.</span></div>
          <div>
            <code>401 / 403</code><span>Authentication or access denied. Check the credential and ownership.</span>
          </div>
          <div><code>404</code><span>The record is missing or is not available to your account.</span></div>
          <div>
            <code>409</code><span>The state changed or request details conflict. Reload and resolve the conflict.</span>
          </div>
          <div><code>429</code><span>A rate limit applies. Wait before trying again.</span></div>
          <div><code>503</code><span>A provider is unavailable or an operation needs reconciliation.</span></div>
        </div>
        <p>
          Use a stable UUID <code>requestID</code> for each purchase, renewal, or swap. Retry the same operation with the
          same ID and input. A response that asks for reconciliation means you should inspect the current state before starting
          another payment.
        </p>
        <p>
          Vault mutations require the current <code>vaultRevision</code>. A 409 response means your snapshot is stale.
          Reload before editing or rotating encryption. A 202 deletion response means provider cleanup remains pending.
          A 410 response means a payment quote expired. A 502 response means a provider returned invalid data or
          rejected the operation.
        </p>
      </section>
      <section id="security">
        <h2>Encryption and service availability</h2>
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
            >PUT /identities/:id/creation</code
          >, then provision the validated draft. Portrait generation, email, phone, billing, and wallet operations
          depend on their configured providers. Names and biographies are generated locally.
        </p>
        <div class="policy-note">
          <p>
            Network routing is unavailable. <code>GET /extension</code> returns
            <code>network.status = 'unavailable'</code>. No proxy activation or device VPN endpoint exists. Crypto
            billing can be disabled independently of user wallets.
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
      {#each groups as group (group.id)}<section id={group.id} class="endpoint-group">
          <h2>{group.title}<span>{group.endpoints.length}</span></h2>
          <div class="endpoints">
            {#each group.endpoints as endpoint (`${endpoint.method}-${endpoint.path}`)}<details>
                <summary
                  ><span class="method" class:write={endpoint.method !== 'GET'}>{endpoint.method}</span><code
                    >{endpoint.path}</code
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
        are optional. Do not send plaintext secrets in place of encrypted fields. Example tokens, provider references, and
        values in angle brackets must be replaced with your own results. Ciphertext examples describe the required format
        and are not usable encrypted secrets. JSON requests require
        <code>Content-Type: application/json</code>. Unless a route says otherwise, a successful request returns HTTP
        200.
        <a href="/contact">Report a documentation issue</a>.
      </p>
    </div>
  </div>
</PublicPage>

<style>
  .docs-layout {
    display: grid;
    grid-template-columns: 210px minmax(0, 1fr);
    gap: 65px;
  }
  .docs-navigation {
    position: sticky;
    top: calc(var(--public-header-height) + 24px);
    max-height: calc(100dvh - var(--public-header-height) - 48px);
    overflow-y: auto;
    align-self: start;
    display: grid;
    gap: 4px;
    padding-right: 20px;
    border-right: 1px solid #a5b4fc20;
  }
  .docs-navigation a {
    font-size: 11px;
    line-height: 1.7;
    padding: 10px 0;
    text-decoration: none;
    color: #94a3c2;
  }
  .docs-navigation a:hover {
    color: #c4b5fd;
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
    background: #a5b4fc0c;
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
    border: 1px solid #a5b4fc30;
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
  }
  button {
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
  button[aria-pressed='true'] {
    color: #d9d0ff;
    border-color: #a394ed40;
    background: #a394ed15;
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
    border: 1px solid #a5b4fc25;
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
    border-bottom: 1px solid #a5b4fc14;
    padding: 12px 0;
    font-size: 12px;
    line-height: 1.7;
  }
  .endpoint-search {
    padding: 25px;
    background: #111a30;
    border: 1px solid #a5b4fc25;
    border-radius: 8px;
    margin-top: 40px;
  }
  .endpoint-search label {
    display: block;
    font-size: 12px;
    color: #c2cce5;
    margin-bottom: 12px;
  }
  .endpoint-search input {
    width: 100%;
    border: 1px solid #a5b4fc35;
    border-radius: 6px;
    padding: 13px;
    background: #0c1325;
    color: #d5def3;
    font-size: 12px;
    outline: none;
  }
  .endpoint-search input:focus {
    border-color: #ad9eed;
    box-shadow: 0 0 0 3px #ad9eed15;
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
    color: #a79acf;
    border: 1px solid #a5b4fc25;
    padding: 4px 7px;
    border-radius: 4px;
  }
  .endpoints {
    border: 1px solid #a5b4fc25;
    border-radius: 8px;
    overflow: hidden;
  }
  details + details {
    border-top: 1px solid #a5b4fc18;
  }
  summary {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) 15px;
    align-items: start;
    gap: 12px;
    list-style: none;
    padding: 17px;
    cursor: pointer;
    background: #a5b4fc04;
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
    color: #7dc4e8;
    font:
      10px 'Fira Code Variable',
      monospace;
    border: 1px solid #7dc4e835;
    padding: 3px;
    text-align: center;
    border-radius: 4px;
  }
  .method.write {
    color: #bda8ef;
    border-color: #bda8ef35;
  }
  .expand {
    color: #b09eed;
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
    border: 1px solid #a5b4fc18;
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
    .docs-layout {
      grid-template-columns: 1fr;
      gap: 30px;
    }
    .docs-navigation {
      position: static;
      max-height: none;
      border-right: 0;
      padding-right: 0;
      display: flex;
      gap: 10px 20px;
      flex-wrap: wrap;
      padding-bottom: 22px;
    }
    .docs-navigation a {
      padding-block: 4px;
    }
  }
  @media (max-width: 500px) {
    .code-toolbar button {
      padding: 8px;
      font-size: 9px;
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
