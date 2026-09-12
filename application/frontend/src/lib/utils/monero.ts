import {identity, moneroData} from '$store';
import {encrypt, decrypt, getMasterKey} from '$utils/cryptography';
import {get} from 'svelte/store';

export function idbOperation(mode: 'readonly' | 'readwrite' | 'delete', id: string, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ShadowSelf_XMR', 1);
    req.onupgradeneeded = (e: any) => e.target.result.createObjectStore('wallets');
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('wallets', mode === 'delete' ? 'readwrite' : mode);
      const store = tx.objectStore('wallets');

      const op = mode === 'readonly' ? store.get(id) : mode === 'delete' ? store.delete(id) : store.put(data, id);
      tx.oncomplete = () => {
        db.close();
        resolve(op.result);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
      op.onerror = () => reject(op.error);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function readMoneroCache(id: string, key: CryptoKey) {
  const saved = await idbOperation('readonly', id);
  if (!saved) return null;

  const plaintext = await decrypt(saved, key);
  if (!plaintext) throw new Error('Wallet cache cannot be unlocked. Clear the cache and sync again');
  const data = JSON.parse(plaintext);
  for (const bytes of [data.keys, data.cache]) {
    if (!Array.isArray(bytes) || !bytes.every((value) => Number.isInteger(value) && value >= 0 && value <= 255)) {
      throw new Error('Wallet cache is invalid. Clear the cache and sync again');
    }
  }

  return {keys: Uint8Array.from(data.keys), cache: Uint8Array.from(data.cache)};
}

export async function saveMoneroCache(id: string, key: CryptoKey, buffers: DataView[]) {
  const bytes = buffers.map((buffer) => Array.from(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)));
  await idbOperation('readwrite', id, await encrypt(JSON.stringify({keys: bytes[0], cache: bytes[1]}), key));
}

export async function transferMonero(nodeUrl: string, address: string, amount: string, priority: number) {
  if (!/^\d+(?:\.\d{1,12})?$/.test(amount)) throw new Error('Enter a Monero amount with at most 12 decimal places');
  const [whole, fraction = ''] = amount.split('.');
  const atoms = BigInt(whole) * 1_000_000_000_000n + BigInt(fraction.padEnd(12, '0'));
  if (atoms <= 0n) throw new Error('Enter an amount greater than zero');

  const account = get(identity);
  const cacheID = `${account.id}:${account.walletBlob}`;
  const key = await getMasterKey();

  return navigator.locks.request(`shadowself-xmr-${account.id}`, {ifAvailable: true}, async (lock) => {
    if (!lock) throw new Error('Wallet sync or another transaction is running. Wait for it to finish');
    const data = await readMoneroCache(cacheID, key);
    if (!data) throw new Error('Sync the Monero wallet before sending');
    const monerots = await import('monero-ts');
    monerots.LibraryUtils.setWorkerDistPath(new URL('/monero.worker.js', location.origin).href);
    const wallet = await monerots.openWalletFull({
      networkType: monerots.MoneroNetworkType.MAINNET,
      server: {uri: nodeUrl},
      password: 'shadowself_xmr',
      keysData: data.keys,
      cacheData: data.cache,
    });

    try {
      await wallet.sync();
      if (get(identity).walletBlob !== account.walletBlob) throw new Error('Wallet encryption changed. Unlock it again');
      const transaction = await wallet.createTx({accountIndex: 0, address, amount: atoms, relay: false, priority});
      await saveMoneroCache(cacheID, key, await wallet.getData());

      try {
        await wallet.relayTx(transaction);
      } catch {
        throw new Error('Broadcast could not be confirmed. Sync and check transaction history before sending again');
      }

      try {
        await saveMoneroCache(cacheID, key, await wallet.getData());
      } catch {
        return 'Transaction was sent, but the local cache could not be saved. Sync again; do not resend';
      }
    } finally {
      await wallet.close().catch(() => {});
    }
  });
}

export default async function initMoneroScan(
  nodeData: any,
  onCache: (hasCache: boolean) => void,
  onProgress: (progress: number, scanned: number, total: number) => void,
  onSuccess: (data: any) => void,
  onError: () => void,
  signal?: AbortSignal,
) {
  const monerots = await import('monero-ts');
  monerots.LibraryUtils.setWorkerDistPath(new URL('/monero.worker.js', location.origin).href);
  const account = get(identity);
  const identityID = account.id;
  const cacheID = `${identityID}:${account.walletBlob}`;
  const encryptionKey = await getMasterKey();
  const res = await fetch(nodeData.nodeUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_info'}),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error('Monero node is unavailable');
  const currentHeight = (await res.json()).result?.height;
  if (!Number.isSafeInteger(currentHeight) || currentHeight <= 0) throw new Error('Invalid Monero node response');
  const msAgo = Date.now() - new Date(nodeData.startingDate).getTime();
  const restoreHeight = Math.max(0, currentHeight - Math.floor(msAgo / 120000) - 1000);

  const initialState = {
    status: 'Connecting...',
    startingDate: nodeData.startingDate,
    nodeUrl: nodeData.nodeUrl,
    balance: 0,
    unlockedBalance: 0,
    history: [],
  };

  const processBlockchain = async () => {
    let wallet: import('monero-ts').MoneroWalletFull | undefined;
    let progressTracker: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      void wallet?.stopSyncing().catch(() => {});
    };
    signal?.addEventListener('abort', stop, {once: true});
    try {
      if (signal?.aborted) return;
      const localData = await readMoneroCache(cacheID, encryptionKey);

      if (localData) {
        onCache(true);
        wallet = await monerots.openWalletFull({
          fs: {promises: {stat: () => Promise.reject(new Error('Memory'))}} as any,
          networkType: monerots.MoneroNetworkType.MAINNET,
          server: {uri: nodeData.nodeUrl},
          password: 'shadowself_xmr',
          keysData: Uint8Array.from(localData.keys),
          cacheData: Uint8Array.from(localData.cache),
        });
      } else {
        onCache(false);
        wallet = await monerots.createWalletFull({
          networkType: monerots.MoneroNetworkType.MAINNET,
          primaryAddress: get(moneroData).address,
          privateViewKey: get(moneroData).viewKey,
          privateSpendKey: get(moneroData).spendKey,
          server: {uri: nodeData.nodeUrl},
          password: 'shadowself_xmr',
          restoreHeight,
        });
      }

      if (signal?.aborted) return;
      const daemonHeight = await wallet.getDaemonHeight();
      const totalBlocks = daemonHeight - restoreHeight;

      progressTracker = setInterval(async () => {
        try {
          if (signal?.aborted) return;
          const currentHeight = await wallet!.getHeight();

          let percent = 0;
          let scanned = 0;
          if (currentHeight >= restoreHeight && totalBlocks > 0) {
            scanned = currentHeight - restoreHeight;
            percent = (scanned / totalBlocks) * 100;
          }

          const displayPercent = Number(Math.max(0, Math.min(100, percent)).toFixed(2));
          onProgress(displayPercent, Math.max(0, scanned), Math.max(0, totalBlocks));
        } catch (_) {}
      }, 2000);

      await wallet.sync(undefined, undefined, true);
      clearInterval(progressTracker);

      if (signal?.aborted || get(identity).walletBlob !== account.walletBlob) return;
      await saveMoneroCache(cacheID, encryptionKey, await wallet.getData());
      const [balance, unlocked, txs] = await Promise.all([wallet.getBalance(), wallet.getUnlockedBalance(), wallet.getTxs()]);

      const history = txs
        .map((tx: any) => {
          const incoming = Number(tx.getIncomingAmount() || 0);
          const outgoing = Number(tx.getOutgoingAmount() || 0);

          const block = tx.getBlock();
          const timestamp = block ? block.getTimestamp() : Math.floor(Date.now() / 1000);

          return {
            txid: String(tx.getHash()),
            type: (incoming > outgoing ? 'received' : 'sent') as 'sent',
            counterparty: 'RingCT Hidden',
            amount: Math.abs(incoming - outgoing) / 1e12,
            date: new Date(timestamp * 1000),
          };
        })
        .sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

      onProgress(100, totalBlocks, totalBlocks);
      onSuccess({
        balance: Number(balance) / 1e12,
        unlockedBalance: Number(unlocked) / 1e12,
        history,
        status: 'Synced',
      });
    } catch (_) {
      if (!signal?.aborted) onError();
    } finally {
      signal?.removeEventListener('abort', stop);
      clearInterval(progressTracker);
      await wallet?.close().catch(() => {});
    }
  };

  void navigator.locks
    .request(`shadowself-xmr-${identityID}`, {ifAvailable: true}, async (lock) => {
      if (!lock) return onError();
      await processBlockchain();
    })
    .catch(onError);
  return initialState;
}
