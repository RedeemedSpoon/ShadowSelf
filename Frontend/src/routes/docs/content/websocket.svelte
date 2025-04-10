<script lang="ts">
  import {LightBulbIcon} from '$icon';
  import type {Snippet} from 'svelte';

  let {children}: {children: Snippet} = $props();
</script>

<p>
  The ShadowSelf WebSocket API leverages the WebSocket protocol to establish a persistent, two-way communication channel between your
  client application and our server. Unlike traditional HTTP polling, this allows the server to instantly push notifications about
  <b>real-time events</b> related to your synthetic identities, such as the arrival of new emails or SMS messages, directly to your application.
</p>
<p>
  We chose WebSockets over alternatives like <b>webhooks</b> primarily for developer convenience and accessibility. Implementing a WebSocket
  client is straightforward in most environments, including browsers and server-side scripts, and crucially, it does not require your application
  to have a publicly accessible IP address or domain name.
</p>
<p>
  To connect, establish a secure WebSocket connection to the bottom endpoint, replacing :id with the specific identity's unique ID.
  Authentication happens during the initial connection handshake using the standard
  <code>Authorization: Bearer YOUR_API_KEY</code> header, identical to the REST API authentication. Once connected (open event), the server
  begins monitoring; disconnecting (close event) stops the monitoring process for that session.
</p>
<div class="hint-container">
  <LightBulbIcon className="stroke-primary-600" />
  <p class="hint">WebSocket Endpoint: <code>wss://shadowself.io/ws-api/:id</code></p>
</div>
<p>
  To maintain the connection through potential network intermediaries and verify its health, your client must implement a keep-alive
  mechanism. Periodically send a <b>ping</b> message to the server, which will respond with pong if the connection is active. Failure to
  receive a timely pong likely indicates a dropped connection.
</p>
<p>
  All event notifications from the server are delivered as JSON-formatted text messages. Each message object includes a type field that
  identifies the event, along with a corresponding data payload. Your application should parse these messages and route them based on
  their type. Note that sending messages other than "ping" from your client to the server is not part of the intended use and will
  <b>be ignored</b>.
</p>
<p>These message types and the data they care as follows:</p>

<div class="gap-8: grid grid-cols-2">
  <div>
    <h3 id="email-type">Email Type</h3>
    <ul class="mt-4">
      <li><code>type</code> (<span class="string">string</span>): The value is always "email".</li>
      <li>
        <code>email</code> (<span class="object">object</span>): An object containing details of the newly received email:
      </li>
      <ul>
        <li><code>uid</code> (<span class="integer">integer</span>): Unique ID of the email within its mailbox.</li>
        <li>
          <code>messageID</code> (<span class="string">string</span>): The globally unique Message-ID header value. Can be empty for
          drafts.
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
            <li><code>filename</code> (<span class="string">string</span>): Name of the attachment file.</li>
            <li><code>data</code> (<span class="string">string</span>): Base64 encoded attachment data.</li>
          </ul>
        </li>
      </ul>
    </ul>
    <h3 id="message-type">Message Type</h3>
    <ul class="mt-4">
      <li><code>type</code> (<span class="string">string</span>): The value is always "message".</li>
      <li>
        <code>message</code> (<span class="object">object</span>): An object representing the newly received SMS message:
        <ul>
          <li><code>messageID</code> (<span class="string">string</span>): Unique identifier (e.g., Twilio SID).</li>
          <li><code>status</code> (<span class="string">string</span>): Status (e.g., 'received').</li>
          <li><code>date</code> (<span class="string">string</span>): Timestamp (ISO 8601).</li>
          <li><code>error</code> (<span class="string">string</span>): Error details if applicable, else empty.</li>
          <li><code>body</code> (<span class="string">string</span>): SMS content.</li>
          <li><code>from</code> (<span class="string">string</span>): Sender's phone number.</li>
          <li><code>to</code> (<span class="string">string</span>): Recipient's phone number (identity's number).</li>
        </ul>
      </li>
    </ul>
  </div>
  <div>
    {@render children?.()}
  </div>
</div>
