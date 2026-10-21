<script lang="ts">
  import AssetIcon from './AssetIcon.svelte';
</script>

<div class="blockchain" aria-label="Five cryptocurrency nodes connected to a wallet that signs locally">
  <svg class="node-network" viewBox="0 0 470 370" fill="none" aria-hidden="true">
    <g class="connections"><path d="M170 154 97 112M300 147 361 112M170 204 97 246M300 204 373 246M235 242V286" /></g>
    {#each [{asset: 'BTC', x: 70, y: 81}, {asset: 'LTC', x: 388, y: 81}, {asset: 'XMR', x: 70, y: 215}, {asset: 'ETH', x: 400, y: 215}, {asset: 'USDT', x: 235, y: 286}] as node (node.asset)}
      <g class="satellite" transform={`translate(${node.x} ${node.y})`}>
        <path class="small-top" d="M0 0 27 15.5 0 31-27 15.5Z" />
        <path class="small-left" d="M-27 15.5 0 31V62L-27 46.5Z" />
        <path class="small-right" d="M0 31 27 15.5V46.5L0 62Z" />
        <g class={`coin coin-${node.asset.toLowerCase()}`} transform="matrix(1 .577 0 1 -13.5 38.75)"
          ><svg x="-9" y="-9" width="18" height="18"
            ><AssetIcon asset={node.asset as 'BTC' | 'LTC' | 'ETH' | 'XMR' | 'USDT'} /></svg
          ></g>
      </g>
    {/each}
    <path class="cube-top" d="m235 90 65 38-65 38-65-38Z" />
    <path class="cube-left" d="m170 128 65 38v76l-65-38Z" />
    <path class="cube-right" d="m235 166 65-38v76l-65 38Z" />
    <path class="cube-detail" d="m185 159 30 17m-30-4 30 17m42-14 29-17m-29 30 29-17" />
    <path
      class="signing-shield"
      transform="translate(0 -4)"
      d="m235 110 9 4v6c0 5-9 10-9 10s-9-5-9-10v-6l9-4Zm-4 9 3 3 5-6" />
    <text x="235" y="140" text-anchor="middle">Sign locally</text>
  </svg>
  <div class="network-status"><span></span>Broadcast to the network <code>12 confirmations</code></div>
</div>

<style>
  .blockchain {
    width: 100%;
    max-width: 470px;
    position: relative;
  }
  .node-network {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .connections {
    stroke: var(--feature-wallet);
    stroke-opacity: 0.6;
    stroke-width: 1.4;
    stroke-dasharray: 4 5;
    animation: block-traffic 5s linear infinite;
  }
  .satellite > path {
    stroke: #48c492;
    stroke-width: 1.2;
  }
  .small-top {
    fill: #164c38;
  }
  .small-left {
    fill: #102b23;
  }
  .small-right {
    fill: #143b2d;
  }
  .cube-top {
    fill: #1a5940;
    stroke: var(--feature-wallet);
    stroke-width: 1.3;
  }
  .cube-left {
    fill: #112e25;
    stroke: #32ad77;
    stroke-width: 1.3;
  }
  .cube-right {
    fill: #16432f;
    stroke: #40d391;
    stroke-width: 1.3;
  }
  .cube-detail {
    stroke: #68e5a6;
    stroke-width: 2;
    opacity: 0.5;
  }
  .signing-shield {
    stroke: #a7f3d0;
    stroke-width: 1.2;
  }
  text {
    fill: #a7f3d0;
    font-size: 9px;
  }
  .coin-btc {
    color: #ffad32;
  }
  .coin-ltc {
    color: #d6dfec;
  }
  .coin-eth {
    color: #b2bffd;
  }
  .coin-xmr {
    color: #ff8136;
  }
  .coin-usdt {
    color: #65e3b0;
  }
  .network-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: fit-content;
    margin: 2px auto 0;
    padding: 12px;
    border: 1px solid #20dc9140;
    border-radius: 7px;
    background: #101e23;
    color: #a3cebd;
    font-size: 10px;
  }
  .network-status > span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--feature-wallet);
  }
  code {
    font-size: 9px;
    color: #62b99a;
  }
  @keyframes block-traffic {
    to {
      stroke-dashoffset: -45;
    }
  }
  @media (max-width: 400px) {
    .network-status {
      flex-wrap: wrap;
      width: 100%;
    }
  }
</style>
