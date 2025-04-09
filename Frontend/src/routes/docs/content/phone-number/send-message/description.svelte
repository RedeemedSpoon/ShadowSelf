<p>Sends an SMS message from the identity's phone number to a specified recipient (`addressee`).</p>

<h5>Request</h5>
<p>Requires the identity <code>:id</code> as a path parameter and a JSON payload containing the recipient and message body.</p>
<ul>
  <li>
    Request Body (JSON):
    <ul>
      <li>
        <code>addressee</code> (<span class="string">string</span>): The recipient's phone number in E.164 format (e.g.,
        `+14155550000`). Cannot be the identity's own number.
      </li>
      <li>
        <code>body</code> (<span class="string">string</span>): The text content of the SMS message. Must be between 2 and 160
        characters.
      </li>
    </ul>
  </li>
</ul>

<h5>Response Body</h5>
<p>Returns a JSON payload containing the recipient addressee and details of the message successfully sent.</p>
<ul>
  <li><code>addressee</code> (<span class="string">string</span>): The recipient phone number specified in the request.</li>
  <li><code>messageSent</code> (<span class="object">object</span>): An object containing details of the sent message including:</li>

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
