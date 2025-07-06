<p>
  Forwards an existing email (identified by UID) to a new recipient. Subject is prefixed "FWD: " and body prepended with headers.
  Original attachments are included.
</p>

<h5>Request</h5>
<p>Requires identity <code>:id</code> path parameter and JSON payload with UID and forward address.</p>
<ul>
  <li><code>uid</code> (<span class="integer">integer</span>): UID of the email to forward (positive integer).</li>
  <li><code>forward</code> (<span class="string">string</span>): Recipient email address for forwarding.</li>
</ul>

<h5>Response Body</h5>
<p>Returns JSON payload with original UID, forward address, and details of the new forwarded email saved in 'Sent'.</p>
<ul>
  <li><code>uid</code> (<span class="integer">integer</span>): UID of the original forwarded email.</li>
  <li><code>forward</code> (<span class="string">string</span>): Address email was forwarded to.</li>
  <li>
    <code>forwardEmail</code> (<span class="object">object</span>): Details of the new forwarded email (similar structure to
    `sentEmail`, includes attachments with data).
  </li>
</ul>
