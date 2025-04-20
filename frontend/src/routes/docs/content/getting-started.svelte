<script>
  import {LightBulbIcon} from '$icon';
</script>

<p>
  This section guides you through the initial steps required to start using the ShadowSelf API, including enabling access, obtaining
  credentials, and authenticating your requests.
</p>

<h3 id="api-key-&-access">API Key & Access</h3>
<p>
  Before you can make any calls to the API, you need to configure access within your ShadowSelf account settings. Navigate to the
  <a href="/settings">Settings page</a>. There you will find two crucial options related to API usage:
</p>
<ul>
  <li>
    <b>API Access:</b> This is a simple boolean toggle (on/off switch). By default, API access is <b>disabled</b> for all accounts as a
    security precaution. You must explicitly enable this toggle to allow any API interactions with your account using the
    <code>Authorization</code> header.
  </li>
  <li>
    <b>API Key:</b> This is your unique secret credential used for authenticating API requests via the recommended method. It's a
    <b>32-character alphanumeric string</b>. You can generate a new API key directly on the settings page. Please note that only
    <b>one API key can be active at a time</b> per account. Generating a new key will invalidate the previous one. Treat your API key like
    a password – keep it secret and secure. Do not embed it directly in client-side code or commit it to public repositories.
  </li>
</ul>

<h3 id="authentication">Authentication</h3>
<p>
  Every request to the ShadowSelf API must be authenticated to identify your account. We offer two methods for authenticating your
  requests:
</p>
<ul>
  <li>
    <p>
      <b>Cookie <code>token</code>:</b>
      You can authenticate by sending a cookie named <code>token</code> with the exact value of the session token used by your browser
      when logged into the ShadowSelf dashboard. You can typically find this using your browser's developer tools (Inspect Mode ->
      Application/Storage -> Cookies). While this method works, it is <b>not recommended</b> for programmatic access. The cookie value can
      change frequently (e.g., if you log out and back in, revoke all sessions, or change account details like your email address). Relying
      on this method can lead to fragile integrations that break unexpectedly. Use this primarily for quick testing or debugging if needed.
    </p>
  </li>
  <li>
    <p>
      <b>Authorization Header (Recommended):</b>
      This is the preferred and most reliable method for authenticating API requests. It uses your unique API key. First, ensure you have
      enabled <b>API Access</b> and generated an <b>API Key</b> in your settings. Then, for each API request you make, include an
      <code>Authorization</code> header in the HTTP request with the value formatted as <code>Bearer $API_KEY</code>. It's best
      practice to store your API key securely, for example, as an environment variable in your application or script, rather than
      hardcoding it.
    </p>
    <p>Example header: <code>Authorization: Bearer 4bacf7ed2.....</code></p>
  </li>
</ul>

<h3 id="test-integration">Test Integration</h3>
<p>
  Once you have enabled API access and generated your API key, you should test your setup to ensure authentication is working
  correctly. The easiest way is to make a simple <code>GET</code> request to our dedicated test endpoint using the recommended
  <b>Authorization header</b> method.
</p>
<p>
  You can use a tool like <code>cURL</code> in your terminal. Replace <code>$API_KEY</code> with your actual key:
</p>

<pre class="language-curl"><code
    >curl -X GET "https://shadowself.io/api/test" \
     -H "Accept: application/json" \
     -H "Authorization: Bearer $API_KEY"</code></pre>

<p>
  If your API key is valid and API access is enabled for your account, you should receive a <code>200 OK</code> HTTP status code and the
  following text:
</p>
<div class="hint-container">
  <LightBulbIcon className="stroke-primary-600" />
  <p class="hint">Response Text: <code>Authentication is working ;)</code></p>
</div>
<p>If you don't receive the success message, double-check the following:</p>
<ul>
  <li>Is the "API Access" toggle enabled in your ShadowSelf settings?</li>
  <li>Did you copy the entire 32-character API key correctly?</li>
  <li>
    Is the <code>Authorization</code> header formatted exactly as <code>Bearer $API_KEY</code> (with a space after "Bearer")?
  </li>
  <li>Are you sending the request to the correct URL (<code>https://shadowself.io/api/test</code>)?</li>
  <li>Ensure there are no leading/trailing spaces or special characters accidentally included in your key or header.</li>
  <li>If all else fails, check your network connection and regenerate your API key.</li>
</ul>
<p>Once you receive the successful authentication message, you are ready to start making other calls to the ShadowSelf API!</p>
