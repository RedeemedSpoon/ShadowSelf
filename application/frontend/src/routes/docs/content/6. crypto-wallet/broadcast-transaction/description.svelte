<p>
  This endpoint broadcasts a raw hex transaction to the blockchain network. It supports Bitcoin (BTC), Litecoin (LTC), Ethereum (ETH),
  and Tether (USDT).
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter and a JSON request body containing the fields to update.
</p>
<ul>
  <li><code>hex</code> (<span class="string">string</span>): The signed raw transaction in hexadecimal format.</li>
  <li><code>coin</code> (<span class="string">string</span>): The ticker symbol of the cryptocurrency (btc, ltc, eth, usdt).</li>
</ul>

<h5>Response Body</h5>
<p>Returns a JSON object containing the transaction ID if successful.</p>
<ul>
  <li>
    <code>txid</code> (<span class="string">string</span>): The transaction hash (ID) of the broadcasted transaction.
  </li>
</ul>
