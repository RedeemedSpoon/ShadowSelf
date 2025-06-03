<script lang="ts">
  import {LightBulbIcon} from '$icon';
  import type {Snippet} from 'svelte';

  let {children}: {children: Snippet} = $props();
</script>

<p>
  The ShadowSelf Proxy service allows you to route your internet traffic through servers strategically located in the geographical
  region associated with each of your synthetic identities. When you use the proxy configured for a specific identity, your online
  activities will appear to originate from that identity's location (e.g., Canada, UK), effectively masking your real IP address and
  enhancing your anonymity and ability to bypass geo-restrictions.
</p>
<p>
  Each identity with proxy capabilities enabled has its own unique set of connection details. You can retrieve these details –
  including the proxy server address/domain, username, and password – using the <a href="#list-proxies">List Proxies endpoint</a> described
  in the Data Overview section. Remember to treat these credentials securely.
</p>
<p>
  The details provided by the API include: the <code>domain</code> with the location as subdomain, the specific <code>server</code> IP
  address to connect to, the required <code>protocol</code>, the connection <code>port</code>, and the authentication
  <code>username</code>
  (prefixed with <code>usr-</code>) and <code>password</code> (prefixed with <code>pwd-</code>). You will need all these pieces to
  configure your connection.
</p>
<div class="hint-container">
  <LightBulbIcon className="stroke-primary-600" />
  <p class="hint">The proxy URL should look like this: <code>$PROTOCOL://$USER:$PASSWORD@$HOST:$PORT</code></p>
</div>
<p>
  While commonly configured within specific web browsers or applications, these proxy details can potentially be implemented
  system-wide on your computer (Windows, macOS, Linux) to route traffic from most applications, though the setup process varies
  significantly depending on your operating system and may require advanced configuration.
</p>
<div class="grid gap-8 xl:grid-cols-2">
  <div class="md:ml-8">
    <h3 id="implementation">Implementation</h3>
    <p class="mt-4">
      To use the proxy, configure your client (browser, application, OS) with the following details obtained from the <a
        href="#list-proxies">List Proxies API</a> response for your chosen identity:
    </p>
    <ul class="mt-4">
      <li>
        <b>Host / Server Address:</b> Set this to the value from the API response's <code>server</code> key or the <code>domain</code> key.
        This is the destination your client connects to.
      </li>
      <li>
        <b>Port Number:</b> Use the value from the <code>port</code> key in the API response. This will typically always be
        <code>3129</code> or <code>1080</code>.
      </li>
      <li>
        <b>Proxy Type / Protocol:</b> Configure your client to use an "HTTPS Proxy" or "SOCKS5 Proxy".
      </li>
      <li>
        <b>Username:</b> For authentication, provide the value from the <code>username</code> key in the API response.
      </li>
      <li>
        <b>Password:</b> For authentication, provide the value from the <code>password</code> key in the API response.
      </li>
    </ul>
  </div>
  <div>
    {@render children?.()}
  </div>
</div>
