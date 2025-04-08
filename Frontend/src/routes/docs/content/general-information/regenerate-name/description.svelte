<p>
  Regenerates the full name for a specific synthetic identity. This uses a localization-aware generator based on the identity's
  country. You can optionally specify the desired sex to influence the generated name.
</p>

<h5>Request</h5>
<p>This endpoint requires the identity's unique <code>id</code> as a path parameter and accepts an optional JSON request body.</p>
<ul>
  <li>
    <code>sex</code> (<span class="string">string</span>, <span class="optional">optional</span>): Specify 'male' or 'female' to guide
    name generation. If omitted, the identity's current sex setting is used.
  </li>
</ul>

<h5>Response Body</h5>
<p>Returns a JSON object containing the newly generated name.</p>
<ul>
  <li><code>name</code> (<span class="string">string</span>): The newly generated full name for the identity.</li>
</ul>
