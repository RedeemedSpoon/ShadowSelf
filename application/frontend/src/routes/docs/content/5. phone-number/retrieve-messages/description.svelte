<p>
  Retrieves a list of conversations associated with the identity's phone number. For each conversation (grouped by the other party's
  phone number), all messages are returned. The list is sorted with the most recent conversation first.
</p>

<h5>Request</h5>
<p>Requires the identity <code>:id</code> as a path parameter. No request body or query parameters are needed.</p>

<h5>Response Body</h5>
<p>
  Returns a JSON payload containing an array of message objects, where each object represents the latest message in a distinct
  conversation thread.
</p>
<ul>
  <li>
    <code>messages</code> (<span class="array">array</span>): An array of the latest message objects from each conversation, sorted
    reverse-chronologically by message date. Each message object includes:
    <ul>
      <li><code>messageID</code> (<span class="string">string</span>): The unique identifier for the message.</li>
      <li>
        <code>status</code> (<span class="string">string</span>): Delivery status of the message (e.g., 'sent', 'delivered', 'failed',
        'received').
      </li>
      <li><code>date</code> (<span class="string">string</span>): Date and time the message was sent or created (ISO 8601 format).</li>
      <li>
        <code>error</code> (<span class="string">string</span>): Contains error code and message if the message failed (e.g., "30008:
        Unknown error"), otherwise an empty string.
      </li>
      <li><code>body</code> (<span class="string">string</span>): The content of the SMS message.</li>
      <li><code>from</code> (<span class="string">string</span>): Sender's phone number (E.164 format).</li>
      <li><code>to</code> (<span class="string">string</span>): Recipient's phone number (E.164 format).</li>
    </ul>
  </li>
</ul>
