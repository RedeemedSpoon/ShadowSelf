<p>
  Fetches the complete message history for a specific conversation between the identity's phone number and another phone number
  (`addressee`). The messages are sorted reverse-chronologically (most recent first).
</p>

<h5>Request</h5>
<p>
  Requires the identity <code>:id</code> as a path parameter and the other party's phone number (`addressee`) as a query parameter.
</p>
<ul>
  <li>
    <code>addressee</code> (Query Parameter, <span class="string">string</span>): The E.164 formatted phone number of the other party
    in the conversation (e.g., `+14155550000`). Cannot be the identity's own phone number.
  </li>
</ul>

<h5>Response Body</h5>
<p>Returns a JSON payload containing the addressee number and an array of all message objects in the conversation.</p>
<ul>
  <li><code>addressee</code> (<span class="string">string</span>): The phone number of the other party in the conversation.</li>
  <li>
    <code>conversation</code> (<span class="array">array</span>): An array containing all message objects exchanged between the
    identity and the addressee, sorted reverse-chronologically. The structure of each message object is the same as described in
    "Retrieve Messages", this means:
  </li>
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
</ul>
