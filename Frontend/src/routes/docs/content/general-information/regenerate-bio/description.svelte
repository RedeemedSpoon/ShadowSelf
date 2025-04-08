<p>
  Regenerates the biography (bio) for a specific synthetic identity. This uses a localization-aware generator based on the identity's
  country to create a plausible short bio.
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter. It does not accept any request body or query parameters.
</p>

<h5>Response Body</h5>
<p>Returns a JSON object containing the newly generated biography.</p>
<ul>
  <li><code>bio</code> (<span class="string">string</span>): The newly generated biography for the identity.</li>
</ul>
