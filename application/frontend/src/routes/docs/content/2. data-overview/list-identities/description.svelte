<p>
  Retrieves a list of all synthetic identities associated with the authenticated account. Each object in the returned array represents
  one identity and contains summarized information. Use each one's <code>id</code> to make other API calls related to this identity.
</p>

<h5>Request</h5>
<p>This endpoint does not require any request body or query parameters.</p>

<h5>Response Body</h5>
<p>
  Returns <code>No identities were found</code> If no identities are found for the account, it may return an error if you have not bad credentials
  or improperly configured your account.
</p>
<ul>
  <li>
    <code>id</code> (<span class="string">string</span>): A unique identifier for the synthetic identity. Use this ID for other API
    calls related to this specific identity.
  </li>
  <li>
    <code>picture</code> (<span class="string">string</span>): A base64 encoded string representing the identity's profile picture,
    resized to a low (256x256) dimension. you will need to add a data URI scheme like <code>data:image/png;base64,...</code> at the beginning
    to display the image.
  </li>
  <li><code>name</code> (<span class="string">string</span>): The full name associated with the synthetic identity.</li>
  <li>
    <code>email</code> (<span class="string">string</span>): The email address associated with this identity including both the
    username and domain.
  </li>
  <li>
    <code>phone</code> (<span class="string">string</span>): The phone number associated with this identity in the E164 standard format
  </li>
  <li>
    <code>country</code> (<span class="string">string</span>): The ISO 3166 country code derived from the identity's location.
  </li>
  <li>
    <code>location</code> (<span class="string">string</span>): The formatted location string associated with the identity, the city
    first then the country.
  </li>
  <li>
    <code>wallet_keys</code> (<span class="object">object</span>): A JSON object containing the watch-only public keys (XPUBs,
    Addresses, ViewKeys) for Bitcoin, Litecoin, Ethereum, Tether and Monero. Used for monitoring balances.
  </li>
  <li>
    <code>wallet_blob</code> (<span class="string">string</span>): The AES-GCM encrypted base64 string containing the private mnemonic
    seed. This can only be decrypted by the user's master password client-side.
  </li>
  <li>
    <code>accounts</code> (<span class="integer">integer</span>): The number of associated accounts entries stored for this identity.
  </li>
</ul>
