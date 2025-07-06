<p>
  Sends a new email or a reply/forward from the identity's email account. Allows setting recipient, subject, body, attachments, and
  threading headers. Can optionally delete a draft if the sent email originates from one.
</p>

<h5>Request</h5>
<p>Requires the identity <code>:id</code> as a path parameter and a JSON payload with email details.</p>
<ul>
  <li><code>to</code> (<span class="string">string</span>): Primary recipient's email address.</li>
  <li><code>subject</code> (<span class="string">string</span>): Subject line (max 126 chars).</li>
  <li><code>body</code> (<span class="string">string</span>): Body content (min 2 chars).</li>
  <li>
    <code>inReplyTo</code> (<span class="string">string</span>, <span class="optional">optional</span>): Message-ID being replied to.
  </li>
  <li>
    <code>references</code> (<span class="array">array</span>, <span class="optional">optional</span>): Array of Message-IDs (<span
      class="string">string</span
    >) for threading.
  </li>
  <li>
    <code>attachments</code> (<span class="array">array</span>, <span class="optional">optional</span>): Array of attachment objects
    (max 10). Each object:
    <ul>
      <li><code>filename</code> (<span class="string">string</span>): Filename.</li>
      <li><code>data</code> (<span class="string">string</span>): Base64 content (max ~15MB).</li>
    </ul>
  </li>
  <li>
    <code>draft</code> (<span class="integer">integer</span>, <span class="optional">optional</span>): UID of an existing draft to
    delete after sending.
  </li>
</ul>

<h5>Response Body</h5>
<p>Returns a JSON payload confirming draft deletion and details of the sent email saved to 'Sent'.</p>
<ul>
  <li><code>draft</code> (<span class="integer">integer</span>): UID of deleted draft, or null.</li>
  <li>
    <code>sentEmail</code> (<span class="object">object</span>): Details of the sent email:
    <ul>
      <li><code>uid</code> (<span class="integer">integer</span>): UID in 'Sent'.</li>
      <li><code>messageID</code> (<span class="string">string</span>): New Message-ID assigned.</li>
      <li><code>from</code> (<span class="string">string</span>): Sender's address.</li>
      <li><code>to</code> (<span class="string">string</span>): Primary recipient.</li>
      <li><code>subject</code> (<span class="string">string</span>): Subject line.</li>
      <li><code>date</code> (<span class="string">string</span>): Date sent.</li>
      <li><code>body</code> (<span class="string">string</span>): Body content.</li>
      <li><code>type</code> (<span class="string">string</span>): Body type (<code>html</code> or <code>text</code>)</li>
      <li><code>attachments</code> (<span class="array">array</span>): Sent attachments.</li>
      <li><code>inReplyTo</code> (<span class="string">string</span>): Message-ID being replied to.</li>
      <li><code>references</code> (<span class="array">array</span>): Array of Message-IDs for threading.</li>
    </ul>
  </li>
</ul>
