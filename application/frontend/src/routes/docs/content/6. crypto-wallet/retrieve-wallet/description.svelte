<p>
  This endpoint retrieves the full wallet overview for the identity, including balances, UTXOs, transaction history, current crypto
  prices, and network fees. It covers Bitcoin (BTC), Litecoin (LTC), Ethereum (ETH), and Tether (USDT).
</p>
<p>
  <strong>Note:</strong> Monero (XMR) wallet data is not included in the <code>wallet</code> object as it is managed client-side.
  However, current XMR prices and network fees are provided in the <code>prices</code> and <code>fees</code> objects.
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter. It does not require any request body or query parameters.
</p>

<h5>Response Body</h5>
<p>
  Returns a JSON object containing the current market prices, network fees, and the identity's wallet state for supported
  cryptocurrencies.
</p>
<ul>
  <li>
    <code>prices</code> (<span class="object">object</span>): Current market data for BTC, LTC, ETH, USDT, and XMR. Each entry
    includes:
    <ul>
      <li><code>usdPrice</code> (<span class="integer">integer</span>): Current price in USD.</li>
      <li><code>dailyChange</code> (<span class="integer">integer</span>): 24-hour price change percentage.</li>
      <li><code>chart</code> (<span class="array">array</span>): 7-day price history points.</li>
    </ul>
  </li>
  <li>
    <code>fees</code> (<span class="object">object</span>): Current network fee estimates.
    <ul>
      <li>
        <code>low</code>, <code>medium</code>, <code>high</code> (<span class="integer">integer</span>): Fee rates for different
        priority levels.
      </li>
    </ul>
  </li>
  <li>
    <code>wallet</code> (<span class="object">object</span>): The identity's wallet data for each coin (XMR Excluded).
    <ul>
      <li><code>balance</code> (<span class="integer">integer</span>): Confirmed balance.</li>
      <li><code>status</code> (<span class="string">string</span>): Sync status (e.g., "Synced").</li>
      <li><code>utxos</code> (<span class="array">array</span>): List of unspent transaction outputs (BTC/LTC only).</li>
      <li><code>nonce</code> (<span class="integer">integer</span>): Account nonce (ETH/USDT only).</li>
      <li><code>history</code> (<span class="array">array</span>): Recent transaction history.</li>
    </ul>
  </li>
</ul>
