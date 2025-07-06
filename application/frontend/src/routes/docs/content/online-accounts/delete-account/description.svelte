<p>Permanently deletes a specific stored online account entry using its unique ID. This action is irreversible.</p>

<h5>Request</h5>
<p>
  Requires the identity <code>:id</code> (owner) path parameter and JSON payload specifying the unique ID of the account entry to delete.
</p>
<ul>
  <li><code>id</code> (<span class="integer">integer</span>): The unique ID of the account entry to delete (positive integer).</li>
</ul>

<h5>Response Body</h5>
<p>
  Returns JSON payload confirming the ID of the account entry targeted for deletion. Check HTTP status code (e.g., 200 OK) for success.
</p>
<ul>
  <li><code>id</code> (<span class="integer">integer</span>): The ID specified in the request.</li>
</ul>
