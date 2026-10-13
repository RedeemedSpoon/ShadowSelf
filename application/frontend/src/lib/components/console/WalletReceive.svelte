<script lang="ts">
  import {vaultKey} from '$store';
  import {deriveXPub, decrypt} from '$utils/cryptography';
  import type {FullIdentity, Coins, CryptoAPI} from '$type';
  import QRCode from 'qrcode';
  import Copy from '$component/ui/Copy.svelte';
  import Status from '$component/ui/Status.svelte';

  let {account, coin, crypto}: {account: FullIdentity; coin: Coins; crypto: CryptoAPI} = $props();
  let address = $state('');
  let qr = $state('');
  let error = $state('');

  $effect(() => {
    const key = $vaultKey;
    const selected = coin;
    let cancelled = false;
    address = '';
    qr = '';
    error = '';
    void (async () => {
      try {
        const value =
          selected === 'btc' || selected === 'ltc'
            ? deriveXPub(selected, account.walletKeys[selected], Math.max(0, crypto.wallet[selected].nextIndex))
            : selected === 'xmr'
              ? key
                ? await decrypt(account.walletKeys.xmr.address, key)
                : ''
              : account.walletKeys.evm;

        if (cancelled) {
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
  <Status message={error} kind="error" />{#if address}<img class="qr-image" src={qr} alt="Receive address QR code" /><Copy
      value={address}
      label="Copy address" />{:else}<Status message="Unlock this identity to view its Monero address." />{/if}
</section>
