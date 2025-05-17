<p>
  Updates one or more attributes of a specific synthetic identity. This endpoint allows modifying core characteristics like name, bio,
  age, sex, ethnicity, and profile picture.
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter and a JSON request body containing the fields to update.
</p>
<ul>
  <li>
    <code>name</code> (<span class="string">string</span>, <span class="optional">optional</span>): Must be 2-30 characters long.
    Allows letters, spaces, hyphens, apostrophes.
  </li>
  <li>
    <code>bio</code> (<span class="string">string</span>, <span class="optional">optional</span>): Must be 10-126 characters long if
    provided (can be empty string <code>""</code> to clear).
  </li>
  <li><code>sex</code> (<span class="string">string</span>, <span class="optional">optional</span>): Must be 'male' or 'female'.</li>
  <li>
    <code>age</code> (<span class="integer">integer</span>, <span class="optional">optional</span>): Must be a whole number between 18
    and 60.
  </li>
  <li>
    <code>ethnicity</code> (<span class="string">string</span>, <span class="optional">optional</span>): Must be a valid ethnicity
    string from the allowed list.
  </li>
  <li>
    <code>picture</code> (<span class="string">string</span>, <span class="optional">optional</span>): Must be a valid base64 encoded
    string (without data URI prefix). Use with caution, typically regenerated rather than manually set.
  </li>
</ul>

<h5>Response Body</h5>
<p>
  Returns a JSON object containing the current values of <b>all</b> the updatable fields (name, bio, sex, age, ethnicity, picture) after
  the update operation has been applied.
</p>
<ul>
  <li><code>name</code> (<span class="string">string</span>): The current name.</li>
  <li><code>bio</code> (<span class="string">string</span>): The current biography.</li>
  <li><code>sex</code> (<span class="string">string</span>): The current sex.</li>
  <li><code>age</code> (<span class="integer">integer</span>): The current age.</li>
  <li><code>ethnicity</code> (<span class="string">string</span>): The current ethnicity.</li>
  <li><code>picture</code> (<span class="string">string</span>): The current base64 encoded picture data.</li>
</ul>
