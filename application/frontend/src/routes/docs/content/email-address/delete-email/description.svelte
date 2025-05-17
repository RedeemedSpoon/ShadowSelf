<p>
  Moves a specific email (identified by mailbox and UID) to the 'Junk' folder. Emails moved to 'Junk' are automatically and permanently
  deleted after 7 days. This action cannot be performed on emails already residing in the 'Junk' folder.
</p>

<h5>Request</h5>
<p>Requires identity <code>:id</code> path parameter and JSON payload specifying mailbox and UID to move to Junk.</p>
<ul>
  <li>
    Request Body (JSON):
    <ul>
      <li>
        <code>mailbox</code> (<span class="string">string</span>): Mailbox where the email currently resides (e.g., "INBOX", "Sent",
        "Drafts"). Cannot be "Junk".
      </li>
      <li>
        <code>uid</code> (<span class="integer">integer</span>): UID of the email within the specified mailbox (positive integer).
      </li>
    </ul>
  </li>
</ul>

<h5>Response Body</h5>
<p>Returns JSON payload confirming mailbox and UID targeted for moving to Junk. Check HTTP status code (e.g., 200 OK) for success.</p>
<ul>
  <li><code>mailbox</code> (<span class="string">string</span>): Mailbox specified in request.</li>
  <li><code>uid</code> (<span class="integer">integer</span>): UID specified in request.</li>
</ul>
