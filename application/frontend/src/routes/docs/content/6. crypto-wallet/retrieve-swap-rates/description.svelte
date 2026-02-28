<p>
  This endpoint retrieves available swap rates and providers for exchanging one cryptocurrency for another. It uses the Trocador API to
  find the best rates.
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter and a JSON request body containing the fields to update.
</p>
<ul>
  <li><code>coinFrom</code> (<span class="string">string</span>): The ticker symbol of the coin to swap from (e.g., "btc").</li>
  <li><code>coinTo</code> (<span class="string">string</span>): The ticker symbol of the coin to swap to (e.g., "xmr").</li>
  <li><code>amount</code> (<span class="integer">integer</span>): The amount of <code>coinFrom</code> to swap.</li>
</ul>

<h5>Response Body</h5>
<p>Returns a JSON object containing the trade ID and a list of available providers with their rates.</p>
<ul>
  <li><code>tradeID</code> (<span class="string">string</span>): A unique identifier for this swap quote.</li>
  <li><code>bestProvider</code> (<span class="string">string</span>): The name of the provider offering the best rate.</li>
  <li><code>coinFrom</code> (<span class="string">string</span>): The input coin ticker.</li>
  <li><code>coinTo</code> (<span class="string">string</span>): The output coin ticker.</li>
  <li><code>amount</code> (<span class="integer">integer</span>): The input amount.</li>
  <li>
    <code>providers</code> (<span class="array">array</span>): A list of available providers. Each object includes:
    <ul>
      <li><code>name</code> (<span class="string">string</span>): Provider name.</li>
      <li>
        <code>returnCoin</code> (<span class="integer">integer</span>): Estimated amount of <code>coinTo</code> you will receive.
      </li>
      <li><code>returnUsd</code> (<span class="integer">integer</span>): Estimated USD value of the return.</li>
      <li><code>isFixed</code> (<span class="boolean">boolean</span>): Whether the rate is fixed or floating.</li>
      <li><code>eta</code> (<span class="string">string</span>): Estimated time for the swap.</li>
      <li><code>kycRating</code> (<span class="string">string</span>): KYC risk level (e.g., "C").</li>
    </ul>
  </li>
</ul>
