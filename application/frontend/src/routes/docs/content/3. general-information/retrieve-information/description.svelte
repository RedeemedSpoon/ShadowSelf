<p>
  Retrieves detailed information for a specific synthetic identity identified by its unique ID. This endpoint provides a comprehensive
  view of the identity's attributes stored within ShadowSelf.
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter. It does not require any request body or query parameters.
</p>

<h5>Response Body</h5>
<p>
  Returns a JSON object containing the detailed attributes of the requested identity. If the ID is not found or does not belong to the
  authenticated user, an appropriate error (e.g., 404 Not Found, 403 Forbidden) will be returned.
</p>
<ul>
  <li><code>id</code> (<span class="string">string</span>): The unique identifier for the synthetic identity.</li>
  <li>
    <code>creation_date</code> (<span class="string">string</span>): The timestamp (ISO 8601 format) indicating when the identity was
    created.
  </li>
  <li><code>proxy_server</code> (<span class="string">string</span>): The proxy server address associated with this identity.</li>
  <li>
    <code>picture</code> (<span class="string">string</span>): A base64 encoded string representing the identity's profile picture.
    Prepend <code>data:image/png;base64,</code> to display.
  </li>
  <li><code>name</code> (<span class="string">string</span>): The full name associated with the synthetic identity.</li>
  <li><code>bio</code> (<span class="string">string</span>): A short biography or description associated with the identity.</li>
  <li><code>age</code> (<span class="integer">integer</span>): The age associated with the identity.</li>
  <li><code>sex</code> (<span class="string">string</span>): The assigned sex ('male' or 'female') for the identity.</li>
  <li><code>ethnicity</code> (<span class="string">string</span>): The assigned ethnicity for the identity.</li>
  <li><code>location</code> (<span class="string">string</span>): The formatted location string (e.g., "City, Country").</li>
  <li><code>email</code> (<span class="string">string</span>): The primary email associated with this identity.</li>
  <li>
    <code>phone</code> (<span class="string">string</span>): The virtual phone number associated with this identity (E.164 format).
  </li>
  <li>
    <code>card</code> (<span class="string">string</span>): The virtual payment card number associated with this identity.
  </li>
</ul>
