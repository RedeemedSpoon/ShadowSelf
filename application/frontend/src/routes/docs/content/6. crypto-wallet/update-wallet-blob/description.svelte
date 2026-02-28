<p>
  This endpoint updates the encrypted wallet blob for the identity. This is used to synchronize the local wallet state with the server,
  ensuring that the user's encrypted seed/keys are safely stored.
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
</ul>

<h5>Response Body</h5>
<p>Returns the updated blob to confirm the save.</p>
<ul>
  <li>
    <code>blob</code> (<span class="string">string</span>): The encrypted wallet blob that was saved.
  </li>
</ul>
