<p>
  Fetches the full content of a specific email, identified by its unique message ID (`uuid` parameter, corresponding to the email's
  `messageID` header). This retrieves details needed for replying/forwarding like headers, subject, recipients, and attachments.
</p>

<h5>Request</h5>
<p>Requires the identity <code>:id</code> as a path parameter and the email's `uuid` (Message-ID) as a query parameter.</p>
<ul>
  <li><code>uuid</code> (Query Parameter, <span class="string">string</span>): The unique Message-ID of the email to fetch.</li>
</ul>

<h5>Response Body</h5>
<p>Returns a JSON payload containing the `uuid` queried and the full details of the fetched email.</p>
<ul>
  <li><code>uuid</code> (<span class="string">string</span>): The message ID requested.</li>
  <li>
    <code>fetchEmail</code> (<span class="object">object</span>): An object containing the full email details, or null if not found.
    Includes:
    <ul>
      <li><code>uid</code> (<span class="integer">integer</span>): The UID of the email.</li>
      <li><code>messageID</code> (<span class="string">string</span>): The globally unique Message-ID header value.</li>
      <li><code>from</code> (<span class="string">string</span>): Sender's email address.</li>
      <li><code>to</code> (<span class="string">string</span>): Primary recipient's email address.</li>
      <li><code>subject</code> (<span class="string">string</span>): Email subject line.</li>
      <li><code>date</code> (<span class="string">string</span>): Date and time (ISO 8601 format).</li>
      <li><code>body</code> (<span class="string">string</span>): A snippet or the full body of the email.</li>
      <li><code>type</code> (<span class="string">string</span>): Format of the body ('html' or 'text').</li>
      <li><code>inReplyTo</code> (<span class="string">string</span>): The Message-ID this email is replying to.</li>
      <li><code>references</code> (<span class="array">array</span> of <span class="string">string</span>)</li>
      <li>
        <code>attachments</code> (<span class="array">array</span>): Array of objects with <code>filename</code> (<span class="string"
          >string</span
        >) and <code>data</code> (<span class="string">string</span> - base64).
      </li>
    </ul>
  </li>
</ul>
