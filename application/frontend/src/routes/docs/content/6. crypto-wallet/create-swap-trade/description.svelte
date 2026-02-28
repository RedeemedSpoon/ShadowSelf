<p>
  This endpoint creates a new swap trade with a selected provider. It returns the deposit address and other details needed to complete
  the swap.
</p>

<h5>Request</h5>
<p>
  This endpoint requires the identity's unique <code>id</code> as a path parameter and a JSON request body containing the fields to update.
</p>
<ul>
  <li><code>tradeID</code> (<span class="string">string</span>): The trade ID received from the <code>swap-rates</code> endpoint.</li>
  <li><code>coinFrom</code> (<span class="string">string</span>): The ticker symbol of the coin to send.</li>
  <li><code>coinTo</code> (<span class="string">string</span>): The ticker symbol of the coin to receive.</li>
  <li><code>amount</code> (<span class="integer">integer</span>): The amount to swap.</li>
  <li><code>destinationAddress</code> (<span class="string">string</span>): The address where the swapped funds should be sent.</li>
  <li>
    <code>refundAddress</code> (<span class="string">string</span>): The address where funds should be returned if the swap fails.
  </li>
  <li><code>provider</code> (<span class="string">string</span>): The name of the selected provider.</li>
  <li><code>isFixed</code> (<span class="boolean">boolean</span>): Whether to use a fixed rate (true) or floating rate (false).</li>
</ul>

<h5>Response Body</h5>
<p>Returns a JSON object with the deposit details for the swap.</p>
<ul>
  <li><code>status</code> (<span class="string">string</span>): The initial status of the trade (e.g., "waiting").</li>
  <li>
    <code>depositAddress</code> (<span class="string">string</span>): The address where you must send the <code>coinFrom</code> funds.
  </li>
  <li><code>depositAmount</code> (<span class="string">string</span>): The exact amount to send.</li>
  <li>
    <code>depositMemo</code> (<span class="string">string</span>, optional): A memo/tag required for the deposit (if applicable).
  </li>
  <li><code>providerTradeId</code> (<span class="string">string</span>): The trade ID assigned by the provider.</li>
  <li><code>externalLink</code> (<span class="string">string</span>): A URL to track the trade status on the provider's website.</li>
</ul>
