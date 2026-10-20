<script lang="ts">
  import {vaultKey} from '$store';
  import {decrypt} from '$utils/cryptography';
  import type {FullIdentity, Coins} from '$type';
  import {reserveWalletAddress} from '$utils/wallet';
  import Button from '$component/ui/Button.svelte';
  import QRCode from 'qrcode';
  import Copy from '$component/ui/Copy.svelte';
  import Status from '$component/ui/Status.svelte';

  let {account, coin}: {account: FullIdentity; coin: Coins} = $props();
  let address = $state('');
  let qr = $state('');
  let error = $state('');
  let pending = $state(true);
  let retry = $state(0);
  const requests: Record<string, string> = {};

  $effect(() => {
    const key = $vaultKey;
    const selected = coin;
    const scope = `${account.id}:${selected}`;
    const attempt = retry;

    requests[scope] ||= globalThis.crypto.randomUUID();
    const requestID = requests[scope];
    let cancelled = false;
    address = '';
    qr = '';
    error = '';
    pending = true;
    void (async () => {
      try {
        const value =
          selected === 'btc' || selected === 'ltc'
            ? (await reserveWalletAddress(account, selected, 0, requestID)).address
            : selected === 'xmr'
              ? key
                ? await decrypt(account.walletKeys.xmr.address, key)
                : ''
              : account.walletKeys.evm;

        if (cancelled || retry !== attempt) {
          return;
        }

        address = value;

        if (value) {
          const image = await QRCode.toDataURL(value, {width: 240, margin: 2});

          if (!cancelled) {
            qr = image;
          }
        }
      } catch (cause) {
        if (!cancelled) {
          error = cause instanceof Error ? cause.message : 'Could not create a receive address.';
        }
      } finally {
        if (!cancelled) {
          pending = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  });
</script>

<section class="panel">
  <h3>Receive {coin.toUpperCase()}</h3>
  <p>Use the correct network. USDT uses Ethereum ERC-20.</p>
  <Status message={error} kind="error" />
  {#if pending}
    <Status message="Checking address history and creating a receive address…" />
  {:else if address}
    {#if qr}<img class="qr-image" src={qr} alt="Receive address QR code" />{/if}
    <Copy value={address} label="Copy address" />
  {:else if error}
    <Button variant="secondary" onclick={() => retry++}>Retry address lookup</Button>
  {:else}
    <Status message="Unlock this identity to view its Monero address." />
  {/if}
</section>
