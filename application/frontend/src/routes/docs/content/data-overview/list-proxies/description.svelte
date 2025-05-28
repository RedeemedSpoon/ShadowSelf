<p>
  Retrieves the HTTPS proxy configuration details for all synthetic identities associated with the authenticated user. This allows
  routing traffic through servers located in the identity's geographical region.
</p>

<h5>Request</h5>
<p>This endpoint does not require any request body or query parameters.</p>

<h5>Response Body</h5>
<p>
  Returns a JSON payload containing the user's username and an array of identity objects, each detailing the proxy configuration for
  that identity.
</p>
<ul>
  <li><code>username</code> (<span class="string">string</span>): The username of the authenticated user.</li>
  <li>
    <code>identities</code> (<span class="array">array</span>): An array of identity proxy configuration objects. Each object includes:
    <ul>
      <li><code>id</code> (<span class="string">string</span>): The unique identifier of the synthetic identity.</li>
      <li><code>name</code> (<span class="string">string</span>): The name of the synthetic identity.</li>
      <li>
        <code>location</code> (<span class="string">string</span>): The geographical location associated with the identity (e.g., "CA,
        Toronto, Canada").
      </li>
      <li><code>picture</code> (<span class="string">string</span>): Base64 encoded profile picture data.</li>
      <li>
        <code>domain</code> (<span class="string">string</span>): A generated domain name representing the proxy endpoint for the
        identity's location (e.g., `ca.shadowself.io`). Use this or the `server` IP for configuration.
      </li>
      <li>
        <code>server</code> (<span class="string">string</span>): The specific IP address or hostname of the proxy server assigned to
        this identity.
      </li>
      <li>
        <code>https</code> (<span class="string">number</span>): The HTTPS port, TLS encryption is required.
      </li>
      <li>
        <code>socks5</code> (<span class="string">number</span>): The Socks port, version 5 only.
      </li>
      <li>
        <code>username</code> (<span class="string">string</span>): The username required for proxy authentication (prefixed with
        `usr-`).
      </li>
      <li>
        <code>password</code> (<span class="string">string</span>): The password required for proxy authentication (prefixed with
        `pwd-`).
      </li>
    </ul>
  </li>
</ul>
