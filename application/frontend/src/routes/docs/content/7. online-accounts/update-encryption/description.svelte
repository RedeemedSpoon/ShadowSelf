<p>
  Updates the encrypted <code>password</code> and/or <code>totp</code> fields for multiple account entries at once. This is primarily for
  re-encrypting credentials client-side, e.g., after changing a master password.
</p>
<br />
<p>
  Retrieve all accounts, re-encrypt sensitive fields (password, totp) client-side with the new key/method, then send an array
  containing objects for each <b>account entry</b> needing update, including its <code>id</code> and the newly encrypted
  <code>password</code>
  and/or <code>totp</code>.
</p>

<h5>Request</h5>
<p>Requires identity <code>:id</code> path parameter and JSON payload with an array of accounts with newly re-encrypted data.</p>
<ul>
  <li>
    <code>accounts</code> (<span class="array">array</span>): Array of account objects to update. Each object:
    <ul>
      <li><code>id</code> (<span class="integer">integer</span>): Unique ID of the account entry.</li>
      <li><code>password</code> (<span class="string">string</span>): Newly <b>client-side re-encrypted</b> password data.</li>
      <li>
        <code>totp</code> (<span class="string">string</span>, <span class="optional">optional</span>): Newly
        <b>client-side re-encrypted</b> TOTP secret. Include only if the entry has a TOTP secret.
      </li>
    </ul>
  </li>
</ul>

<h5>Response Body</h5>
<p>
  Returns JSON payload confirming the update by echoing back the array of account objects sent. Check HTTP status code for success.
</p>
<ul>
  <li><code>accounts</code> (<span class="array">array</span>): Array of account update objects sent in the request.</li>
</ul>
