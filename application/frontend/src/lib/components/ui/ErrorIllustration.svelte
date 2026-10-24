<script lang="ts">
  import {ERROR_ILLUSTRATION_STARS} from '$constant';
  import type {ErrorScene} from '$type';

  let {scene, animated = true}: {scene: ErrorScene; animated?: boolean} = $props();
  const id = $props.id();
</script>

<svg class="scene" class:paused={!animated} viewBox="0 0 360 260" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#35405b" /><stop offset="1" stop-color="#171c31" />
    </linearGradient>
    <linearGradient id={`${id}-violet`} x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#8170ee" /><stop offset="1" stop-color="#35265f" />
    </linearGradient>
    <filter id={`${id}-screen-softness`} x="-10%" y="-20%" width="120%" height="140%">
      <feGaussianBlur stdDeviation=".6" />
    </filter>
  </defs>
  <ellipse cx="180" cy="230" rx="124" ry="9" fill="#070b18" opacity=".65" />
  <g>
    {#each ERROR_ILLUSTRATION_STARS[scene] as [x, y, radius], index (index)}
      {#if radius < 1.5}
        <circle cx={x} cy={y} r={radius} fill="#8390ab" opacity=".5" />
      {:else}
        <path
          d="M0-1 .24-.24 1 0 .24.24 0 1-.24.24-1 0-.24-.24Z"
          transform={`translate(${x} ${y}) scale(${radius})`}
          fill={index % 2 ? '#8170ee' : '#8c99b3'}
          opacity={index % 2 ? '.75' : '.55'} />
      {/if}
    {/each}
  </g>
  {#if scene === 'orbit'}
    <g class="drift" transform="rotate(-18 180 121)">
      <g opacity=".35" fill="none" stroke="#607292">
        <ellipse cx="180" cy="121" rx="142" ry="52" />
        <ellipse cx="180" cy="121" rx="105" ry="94" stroke-dasharray="3 8" />
      </g>
      <path d="M38 121H103M256 121H322" stroke="#8170ee" stroke-dasharray="4 6" />
      <g
        ><path d="M141 115H146M141 127H146M212 115H218M212 127H218" stroke="#8170ee" stroke-width="2" /><path
          d="M103 94H141V148H103ZM218 94H256V148H218Z"
          fill="#29234f"
          stroke="#8170ee" /><path
          d="M115 94V148M128 94V148M103 112H141M103 130H141M231 94V148M244 94V148M218 112H256M218 130H256"
          stroke="#61559c" /><rect
          x="146"
          y="81"
          width="66"
          height="82"
          rx="15"
          fill={`url(#${id}-metal)`}
          stroke="#9b91ff" /><circle cx="179" cy="110" r="11" fill="#91a0b8" /><path
          d="M160 143Q160 121 179 125Q198 121 198 143"
          fill="#91a0b8" /><path d="M179 81V62" stroke="#8170ee" stroke-width="3" />
        <path
          d="M164 49Q179 79 194 49Q179 57 164 49Z"
          fill={`url(#${id}-violet)`}
          stroke="#9b91ff"
          stroke-width="1.5" />
        <ellipse cx="179" cy="49" rx="15" ry="4" fill={`url(#${id}-metal)`} stroke="#9b91ff" stroke-width="1.5" />
        <path d="M179 50V38" stroke="#a2aec5" stroke-width="2" stroke-linecap="round" />
        <circle cx="179" cy="36" r="2.5" fill="#8170ee" /></g>
      <g fill="#8170ee"><circle cx="38" cy="121" r="5" /><circle cx="322" cy="121" r="5" /></g>
    </g>
  {:else if scene === 'jelly'}
    <ellipse cx="183" cy="205" rx="105" ry="15" fill="#070b18" /><path
      d="M89 181Q93 58 180 56Q267 58 273 181Q260 206 181 208Q102 206 89 181Z"
      fill={`url(#${id}-violet)`}
      fill-opacity=".5"
      stroke="#8170ee" /><path
      d="M111 148Q119 84 157 79M252 158Q246 111 233 100"
      stroke="#b2a4ef"
      stroke-width="4"
      stroke-linecap="round"
      opacity=".45"
      fill="none" />
    <g transform="rotate(12 180 134)"
      ><path d="M172 101V80Q172 70 182 70Q192 70 192 80V101" fill="none" stroke="#b3a8da" stroke-width="3" /><rect
        x="143"
        y="99"
        width="77"
        height="83"
        rx="8"
        fill="#1a223c"
        stroke="#9b91ff" /><rect x="168" y="107" width="26" height="4" rx="2" fill="#8170ee" /><circle
        cx="182"
        cy="132"
        r="11"
        fill="#8b9ab5" /><path d="M163 159Q163 142 182 145Q201 142 201 159" fill="#8b9ab5" /><path
        d="M162 170H201"
        stroke="#8170ee" /></g
    ><path d="M118 190Q184 205 250 188" fill="none" stroke="#9b91ff" opacity=".5" />
  {:else if scene === 'coffee'}
    <path d="M49 197H312" stroke="#52607c" /><ellipse cx="184" cy="199" rx="109" ry="12" fill="#17182e" /><g
      transform="rotate(-7 211 130)"
      ><rect x="172" y="52" width="86" height="143" rx="10" fill={`url(#${id}-metal)`} stroke="#63718c" /><g
        fill="#1a2135"
        stroke="#48526e">
        <rect x="182" y="64" width="66" height="34" rx="4" />
        <rect x="182" y="106" width="66" height="34" rx="4" />
        <rect x="182" y="148" width="66" height="34" rx="4" />
      </g>
      <g fill="#8170ee">
        <circle cx="191" cy="81" r="2.5" />
        <circle cx="191" cy="123" r="2.5" />
        <circle cx="191" cy="165" r="2.5" />
      </g>
      <path
        d="M203 75H239M203 81H239M203 87H239M203 117H239M203 123H239M203 129H239M203 159H239M203 165H239M203 171H239"
        stroke="#64718d"
        stroke-width="2"
        stroke-linecap="round" />
      <path d="M199 40l-6-11M215 36V22M231 40l6-11" stroke="#9b91ff" stroke-width="1.5" stroke-linecap="round" /></g>
    <path d="M96 175q35-20 75 2t48 13q-34 14-89 9t-34-24" fill="#493568" /><g transform="rotate(-58 118 153)"
      ><path d="M91 119H138L133 169Q114 182 96 169Z" fill="#8170ee" stroke="#b0a2ef" /><path
        d="M138 131q28-2 21 21q-4 12-24 6"
        fill="none"
        stroke="#9b91ff"
        stroke-width="6" /><ellipse cx="114" cy="119" rx="24" ry="7" fill="#262139" stroke="#9b91ff" /></g
    ><path d="M147 166Q162 140 180 165" fill="none" stroke="#8170ee" stroke-width="5" stroke-linecap="round" /><circle
      cx="164"
      cy="143"
      r="3"
      fill="#9b91ff" />
  {:else if scene === 'break'}
    <path d="M55 144H300M79 145V209M285 145V209" stroke="#65718c" stroke-width="4" /><rect
      x="168"
      y="64"
      width="112"
      height="68"
      rx="6"
      fill={`url(#${id}-metal)`}
      stroke="#6e7c99" />
    <rect x="172" y="68" width="104" height="60" rx="3" fill="#171d30" />
    <path d="M175 68H273Q276 68 276 71V80H172V71Q172 68 175 68Z" fill="#2b3349" />
    <circle cx="178" cy="74" r="2" fill="#c77983" />
    <circle cx="185" cy="74" r="2" fill="#c4a45e" />
    <circle cx="192" cy="74" r="2" fill="#6caa8f" />
    <rect x="202" y="71" width="60" height="6" rx="2" fill="#1b2236" />
    <path d="M172 80H276" stroke="#414b65" stroke-width=".7" />
    <path d="M219 132H229L231 140H217Z" fill={`url(#${id}-metal)`} stroke="#6e7c99" />
    <path d="M211 139H237L244 143H204Z" fill="#4b5872" stroke="#7c89a1" stroke-linejoin="round" />
    <path d="M207 143H241" stroke="#253049" stroke-width="2" /><text
      x="224"
      y="104"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="#8e9bb5"
      filter={`url(#${id}-screen-softness)`}
      opacity=".8"
      font-size="11"
      font-weight="700"><tspan x="224" dy="-8">BE RIGHT</tspan><tspan x="224" dy="16">BACK.</tspan></text>
    <ellipse cx="122" cy="230" rx="38" ry="4" fill="#080d1b" opacity=".6" />
    <rect
      x="89"
      y="84"
      width="56"
      height="72"
      rx="15"
      fill="color-mix(in srgb, var(--accent) 45%, black)"
      stroke="color-mix(in srgb, var(--accent) 70%, black)" />
    <path d="M138 90V148H99Z" fill="color-mix(in srgb, var(--accent) 25%, black)" opacity=".65" />
    <rect
      x="85"
      y="150"
      width="67"
      height="17"
      rx="5"
      fill="color-mix(in srgb, var(--accent) 60%, black)"
      stroke="color-mix(in srgb, var(--accent) 75%, black)" />
    <path d="M131 153H148V162Z" fill="color-mix(in srgb, var(--accent) 30%, black)" opacity=".7" />
    <path d="M118 167V201" stroke="#7d8ba4" stroke-width="4" />
    <path d="M94 213L118 201L143 213M118 201V219" stroke="#74829c" stroke-width="3.5" stroke-linecap="round" />
    <g
      fill="color-mix(in srgb, var(--accent) 35%, black)"
      stroke="color-mix(in srgb, var(--accent) 65%, black)"
      stroke-width=".8">
      <rect x="90" y="213" width="8" height="6" rx="2.5" />
      <rect x="139" y="213" width="8" height="6" rx="2.5" />
      <rect x="114" y="219" width="8" height="6" rx="2.5" />
    </g>
    <ellipse cx="70" cy="143" rx="17" ry="3" fill="#080d1b" opacity=".7" />
    <path d="M60 123H56Q50 123 50 129Q50 136 60 136" stroke="#9b91ff" stroke-width="3" />
    <path d="M60 119H78V137Q78 142 69 142Q60 142 60 137Z" fill="#6253a8" stroke="#9380bf" />
    <path d="M62 120H76" stroke="#332a4b" stroke-width="2" stroke-linecap="round" />
    <path d="M68 112q-6-7 0-14" stroke="#6e638e" fill="none" stroke-linecap="round" />
  {/if}
</svg>

<style>
  .scene {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
    font-family: 'Fira Code Variable', monospace;
  }
  .scene :global(.drift) {
    animation: drift 6s ease-in-out infinite;
  }
  .paused :global(.drift) {
    animation-play-state: paused;
  }
  @keyframes drift {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -7px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .scene :global(.drift) {
      animation: none;
    }
  }
</style>
