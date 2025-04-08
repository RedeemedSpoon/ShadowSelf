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
<ul class="response-body">
  <li>
    <code>id</code> (<span class="string">string</span>): <br /> A unique identifier for the synthetic identity. Use this ID for other API
    calls related to this specific identity.
  </li>
  <li>
    <code>picture</code> (<span class="string">string</span>): <br /> A base64 encoded string representing the identity's profile
    picture, resized to a low (256x256) dimension. you will need to add a data URI scheme like <code>data:image/png;base64,...</code> at
    the beginning to display the image.
  </li>
  <li><code>name</code> (<span class="string">string</span>): <br />The full name associated with the synthetic identity.</li>
  <li>
    <code>email</code> (<span class="string">string</span>): <br />The email address associated with this identity including both the
    username and domain.
  </li>
  <li>
    <code>phone</code> (<span class="string">string</span>): <br />The phone number associated with this identity in the E164 standard
    format
  </li>
  <li>
    <code>card</code> (<span class="integer">integer</span>): <br />The virtual payment card number associated with this identity,
  </li>
  <li>
    <code>country</code> (<span class="string">string</span>): <br />The ISO 3166 country code derived from the identity's location.
  </li>
  <li>
    <code>location</code> (<span class="string">string</span>): <br />The formatted location string associated with the identity, the
    city first then the country.
  </li>
  <li>
    <code>accounts</code> (<span class="integer">integer</span>): <br />The number of associated online accounts stored for this
    identity.
  </li>
</ul>
