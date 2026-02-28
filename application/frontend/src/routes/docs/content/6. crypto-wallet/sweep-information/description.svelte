<p>
  This endpoint scans the blockchain for UTXOs (Unspent Transaction Outputs) and account nonces for a given set of addresses. It is
  useful data before sweeping funds from a wallet or recovering balances.
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter and a JSON request body containing the fields to update.
</p>
<ul>
  <li><code>coin</code> (<span class="string">string</span>): The ticker symbol of the cryptocurrency (btc, ltc, eth, usdt).</li>
  <li><code>addresses</code> (<span class="array">array</span>): An array of string addresses to scan.</li>
</ul>

<h5>Response Body</h5>
<p>Returns a JSON object containing the found UTXOs, total balance, and nonce.</p>
<ul>
  <li>
    <code>utxos</code> (<span class="array">array</span>): A list of found unspent outputs (for BTC/LTC). Each object contains:
    <ul>
      <li><code>txid</code> (<span class="string">string</span>): Transaction ID.</li>
      <li><code>vout</code> (<span class="integer">integer</span>): Output index.</li>
      <li><code>value</code> (<span class="integer">integer</span>): Amount in satoshis/smallest unit.</li>
      <li><code>address</code> (<span class="string">string</span>): The address owning this output.</li>
    </ul>
  </li>
  <li><code>balance</code> (<span class="integer">integer</span>): The total balance found across all addresses.</li>
  <li><code>nonce</code> (<span class="integer">integer</span>): The next transaction nonce (for ETH/USDT).</li>
</ul>
