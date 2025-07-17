<p>
  Permanently deletes all SMS messages exchanged between the identity's phone number and the specified `addressee` number. This action
  is irreversible.
</p>

<h5>Request</h5>
<p>
  Requires identity <code>:id</code> path parameter and JSON payload specifying the addressee whose conversation should be deleted.
</p>
<ul>
  <li>
    <code>addressee</code> (<span class="string">string</span>): The E.164 formatted phone number of the other party whose conversation
    history should be deleted.
  </li>
</ul>

<h5>Response Body</h5>
<p>
  Returns JSON payload confirming the addressee whose conversation was targeted for deletion. Check HTTP status code (e.g., 200 OK) for
  success confirmation.
</p>
<ul>
  <li><code>addressee</code> (<span class="string">string</span>): The phone number specified in the request.</li>
</ul>
