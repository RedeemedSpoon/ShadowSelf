<p>
  Fetches a list of the most recent emails (up to 7 per mailbox) from the primary mailboxes (INBOX, Sent, Drafts, Junk) associated with
  the specified identity's email account. It also returns the total message count for each of these mailboxes. This provides an initial
  snapshot of recent activity and mailbox sizes.
</p>

<h5>Request</h5>
<p>Requires the identity <code>:id</code> as a path parameter. No request body or query parameters are needed.</p>

<h5>Response Body</h5>
<p>Returns a JSON payload containing message counts and separate arrays of recent email objects for each primary mailbox.</p>
<ul>
  <li><code>messagesCount</code> (<span class="integer">integer</span>): Total number of emails in the INBOX.</li>
  <li><code>sentMessagesCount</code> (<span class="integer">integer</span>): Total number of emails in the 'Sent' mailbox.</li>
  <li><code>draftsMessagesCount</code> (<span class="integer">integer</span>): Total number of emails in the 'Drafts' mailbox.</li>
  <li><code>junkMessagesCount</code> (<span class="integer">integer</span>): Total number of emails in the 'Junk' mailbox.</li>
  <li><code>inbox</code> (<span class="array">array</span>): An array containing the most recent email objects from the INBOX.</li>
  <li>
    <code>sent</code> (<span class="array">array</span>): An array containing the most recent email objects from the 'Sent' mailbox.
  </li>
  <li>
    <code>drafts</code> (<span class="array">array</span>): An array containing the most recent email objects from the 'Drafts'
    mailbox.
  </li>
  <li>
    <code>junk</code> (<span class="array">array</span>): An array containing the most recent email objects from the 'Junk' mailbox.
  </li>
</ul>
<p>Each email object within the arrays (`inbox`, `sent`, `drafts`, `junk`) includes:</p>
<ul>
  <li><code>uid</code> (<span class="integer">integer</span>): Unique ID of the email within its mailbox.</li>
  <li>
    <code>messageID</code> (<span class="string">string</span>): The globally unique Message-ID header value. Can be empty for drafts.
  </li>
  <li><code>from</code> (<span class="string">string</span>): Sender's email address.</li>
  <li><code>to</code> (<span class="string">string</span>): Primary recipient's email address.</li>
  <li><code>subject</code> (<span class="string">string</span>): Email subject line.</li>
  <li><code>date</code> (<span class="string">string</span>): Date and time (ISO 8601 format).</li>
  <li><code>body</code> (<span class="string">string</span>): A snippet or the full body of the email.</li>
  <li><code>type</code> (<span class="string">string</span>): Format of the body ('html' or 'text').</li>
  <li><code>inReplyTo</code> (<span class="string">string</span>): The Message-ID this email is replying to.</li>
  <li>
    <code>references</code> (<span class="array">array</span>): An array of Message-IDs (<span class="string">string</span>) for
    threading.
  </li>
  <li>
    <code>attachments</code> (<span class="array">array</span>): An array of attachment objects. Each object contains:
    <ul>
      <li><code>filename</code> (<span class="string">string</span>)</li>
      <li><code>data</code> (<span class="string">string</span>): Base64 encoded attachment data.</li>
    </ul>
  </li>
</ul>
