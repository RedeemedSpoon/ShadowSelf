<p>Retrieves all stored online account entries associated with the specified synthetic identity.</p>

<h5>Request</h5>
<p>Requires the identity <code>:id</code> as a path parameter. No request body or query parameters are needed.</p>

<h5>Response Body</h5>
<p>
  Returns a JSON payload containing an array of stored account objects. The <code>password</code> and <code>totp</code> fields will contain
  the client-side encrypted data as stored.
</p>
<ul>
  <li>
    <code>accounts</code> (<span class="array">array</span>): An array of account objects associated with the identity. Each object
    includes:
    <ul>
      <li><code>id</code> (<span class="integer">integer</span>): The unique identifier for this specific account entry.</li>
      <li><code>username</code> (<span class="string">string</span>): The stored username for the online account.</li>
      <li>
        <code>password</code> (<span class="string">string</span>): The client-side encrypted password. Your client must decrypt this.
      </li>
      <li><code>website</code> (<span class="string">string</span>): The URL of the website associated with the account.</li>
      <li>
        <code>totp</code> (<span class="string">string</span>): The client-side encrypted TOTP secret key. Your client must decrypt
        this to generate codes.
      </li>
      <li>
        <code>algorithm</code> (<span class="string">string</span>): The algorithm used for TOTP generation ('SHA1', 'SHA256',
        'SHA512'), relevant only if <code>totp</code> is set.
      </li>
    </ul>
  </li>
</ul>
