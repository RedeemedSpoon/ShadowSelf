<p>Permanently deletes a specific stored account vault entry using its unique ID. This action is irreversible.</p>

<h5>Request</h5>
<p>
  Requires the identity <code>:id</code> (owner) path parameter and JSON payload specifying the unique ID of the account entry to delete.
</p>
<ul>
  <li><code>id</code> (<span class="integer">integer</span>): The unique ID of the account entry to delete (positive integer).</li>
</ul>

<h5>Response Body</h5>
<p>Returns JSON payload confirming the ID of the account entry targeted for deletion. Check HTTP status code (e.g., 200 OK) for success.</p>
<ul>
  <li><code>id</code> (<span class="integer">integer</span>): The ID specified in the request.</li>
</ul>

<h5>Encryption and concurrent edits</h5>
<p>
  Send the current <code>vaultRevision</code> returned by the account or identity GET request. A successful mutation returns the next revision. A stale revision returns
  HTTP 409; reload before retrying. Missing account IDs return HTTP 404.
</p>
<p>
  Passwords and TOTP secrets use <code>v1.</code> followed by canonical base64 encoding of a 12-byte AES-GCM nonce and ciphertext including its 16-byte authentication
  tag. Each field requires a fresh nonce. The sample ciphertext is illustrative; encrypt your actual values before sending. Optional website and TOTP fields are preserved
  when omitted and cleared when explicitly null or empty.
</p>
