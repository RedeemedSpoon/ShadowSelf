<p>
  This endpoint retrieves the current status of the Monero (XMR) node and the starting date for the identity's wallet. It is important
  to note that Monero wallet synchronization and transaction signing are performed entirely on the client-side (frontend) for enhanced
  security. The backend does not store or manage Monero private keys or wallet state. This endpoint only provides the necessary
  connection details.
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter. It does not require any request body or query parameters.
</p>

<h5>Response Body</h5>
<p>Returns a JSON object with the node status and wallet creation date.</p>
<ul>
  <li>
    <code>startingDate</code> (<span class="string">string</span>): The ISO 8601 timestamp of when the identity was created. Used as
    the restore height date for Monero wallets.
  </li>
  <li>
    <code>status</code> (<span class="string">string</span>): The operational status of the Monero node (e.g., "Network Operational",
    "Syncing", "Node Offline").
  </li>
  <li>
    <code>nodeUrl</code> (<span class="string">string</span>): The URL of the Monero node being used.
  </li>
</ul>
