<p>
  This endpoint updates the encrypted wallet blob and the Monero XMR keys for the identity stored in the database. This is used to
  synchronize the local wallet state with the server, ensuring that the user's encrypted seed/keys are safely stored.
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter and a JSON request body containing the fields to update.
</p>
<ul>
  <li>
    <code>blob</code> (<span class="string">string</span>): The new AES-GCM encrypted base64 string containing the private mnemonic
    seed or wallet data.
  </li>
  <li>
    <code>keys</code> (<span class="object">object</span>): The new AES-GCM encrypted base64 object containing Monero keys. includes:
    <ul>
      <li><code>address</code> (<span class="string">string</span>): Monero encrypted wallet address.</li>
      <li><code>spendKey</code> (<span class="string">string</span>): Monero encrypted spend key.</li>
      <li><code>viewKey</code> (<span class="string">string</span>): Monero encrypted view key.</li>
    </ul>
  </li>
</ul>

<h5>Response Body</h5>
<p>Returns the updated blob and keys to confirm the save.</p>
<ul>
  <li>
    <code>blob</code> (<span class="string">string</span>): The encrypted wallet blob that was saved.
  </li>
  <li>
    <code>keys</code> (<span class="object">object</span>): The encrypted wallet Monero keys that were just saved. includes:
    <ul>
      <li><code>address</code> (<span class="string">string</span>): Monero encrypted wallet address.</li>
      <li><code>spendKey</code> (<span class="string">string</span>): Monero encrypted spend key.</li>
      <li><code>viewKey</code> (<span class="string">string</span>): Monero encrypted view key.</li>
    </ul>
  </li>
</ul>
