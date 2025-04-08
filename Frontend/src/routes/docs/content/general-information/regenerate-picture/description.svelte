<p>
  Regenerates the profile picture for a specific synthetic identity. This uses Stable Diffusion Core to generate a new picture
  influenced by the identity's characteristics. You can optionally provide specific characteristics in the request body to guide the
  generation process.
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter and accepts an
  <span class="optional">optional</span> JSON request body containing parameters to influence image generation.
</p>
<ul>
  <li><code>sex</code> (<span class="string">string</span>, <span class="optional">optional</span>): Must be 'male' or 'female'.</li>
  <li>
    <code>age</code> (<span class="integer">integer</span>, <span class="optional">optional</span>): Must be a whole number between 18
    and 60.
  </li>
  <li>
    <code>ethnicity</code> (<span class="string">string</span>, <span class="optional">optional</span>): Must be a valid ethnicity
    string from the allowed list (check dashboard for the list).
  </li>
  <li>
    <code>bio</code> (<span class="string">string</span>, <span class="optional">optional</span>): A string used as a prompt hint. Must
    be between 10 and 126 characters if provided.
  </li>
</ul>

<h5>Response Body</h5>
<p>Returns a JSON object containing the newly generated profile picture as a base64 encoded string.</p>
<ul>
  <li>
    <code>picture</code> (<span class="string">string</span>): The new base64 encoded profile picture data. Prepend
    <code>data:image/png;base64,</code> to display.
  </li>
</ul>
