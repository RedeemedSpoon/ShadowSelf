<p>
  Updates an existing online account entry identified by its unique <code>id</code>. Provide the account entry's <code>id</code> in the
  request body. Encrypt <code>password</code> and <code>totp</code> client-side if updating them.
</p>

<h5>Request</h5>
<p>Requires the identity <code>:id</code> (owner) path parameter and JSON payload with account entry ID and fields to update.</p>
<ul>
  <li>
    Request Body (JSON):
    <ul>
      <li><code>id</code> (<span class="integer">integer</span>): The unique ID of the account entry to edit.</li>
      <li><code>username</code> (<span class="string">string</span>): Updated username (max 25 chars).</li>
      <li><code>password</code> (<span class="string">string</span>): Updated <b>client-side encrypted</b> password data.</li>
      <li><code>website</code> (<span class="string">string</span>, <span class="optional">optional</span>): Updated website URL.</li>
      <li>
        <code>totp</code> (<span class="string">string</span>, <span class="optional">optional</span>): Updated
        <b>client-side encrypted</b> TOTP secret data.
      </li>
      <li>
        <code>algorithm</code> (<span class="string">string</span>, <span class="optional">optional</span>): The TOTP algorithm
        ('SHA1', 'SHA256', 'SHA512'). Required if <code>totp</code> is updated.
      </li>
    </ul>
  </li>
</ul>

<h5>Response Body</h5>
<p>Returns JSON payload confirming the details of the updated account entry. Sensitive fields returned encrypted.</p>
<ul>
  <li><code>id</code> (<span class="integer">integer</span>): ID of edited entry.</li>
  <li><code>username</code> (<span class="string">string</span>)</li>
  <li><code>password</code> (<span class="string">string</span>): Updated encrypted password.</li>
  <li><code>website</code> (<span class="string">string</span>)</li>
  <li><code>totp</code> (<span class="string">string</span>): Updated encrypted TOTP secret.</li>
  <li><code>algorithm</code> (<span class="string">string</span>)</li>
</ul>
