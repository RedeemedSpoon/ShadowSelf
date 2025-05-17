<p>
  Adds a new online account entry associated with the specified identity. Remember to encrypt the <code>password</code> and
  <code>totp</code> secret on the client-side before sending.
</p>

<h5>Request</h5>
<p>Requires the identity <code>:id</code> as a path parameter and a JSON payload containing the account details.</p>
<ul>
  <li>
    Request Body (JSON):
    <ul>
      <li><code>username</code> (<span class="string">string</span>): The username (max 25 chars).</li>
      <li>
        <code>password</code> (<span class="string">string</span>): The <b>client-side encrypted</b> password data (e.g., Base64).
      </li>
      <li><code>website</code> (<span class="string">string</span>, <span class="optional">optional</span>): The website URL.</li>
      <li>
        <code>totp</code> (<span class="string">string</span>, <span class="optional">optional</span>): The
        <b>client-side encrypted</b> TOTP secret key data (e.g., Base64).
      </li>
      <li>
        <code>algorithm</code> (<span class="string">string</span>, <span class="optional">optional</span>): The TOTP algorithm
        ('SHA1', 'SHA256', 'SHA512'). Required if <code>totp</code> is provided.
      </li>
    </ul>
  </li>
</ul>

<h5>Response Body</h5>
<p>
  Returns a JSON payload confirming the details of the added account, including its new <code>id</code>. Sensitive fields are returned
  as sent (encrypted).
</p>
<ul>
  <li><code>id</code> (<span class="integer">integer</span>): The unique ID assigned.</li>
  <li><code>username</code> (<span class="string">string</span>)</li>
  <li><code>password</code> (<span class="string">string</span>): The encrypted password provided.</li>
  <li><code>website</code> (<span class="string">string</span>)</li>
  <li><code>totp</code> (<span class="string">string</span>): The encrypted TOTP secret provided.</li>
  <li><code>algorithm</code> (<span class="string">string</span>)</li>
</ul>
