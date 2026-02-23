import {identity, moneroData} from '$store';
import * as monerots from 'monero-ts';
import {get} from 'svelte/store';

function idbOperation(mode: 'readonly' | 'readwrite', id: string, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ShadowSelf_XMR', 1);
    req.onupgradeneeded = (e: any) => e.target.result.createObjectStore('wallets');
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('wallets', mode);
      const store = tx.objectStore('wallets');

      const op = mode === 'readonly' ? store.get(id) : store.put(data, id);
      op.onsuccess = () => resolve(op.result);
      op.onerror = () => reject(op.error);
    };
    req.onerror = () => reject(req.error);
  });
}

export default async function initMoneroScan(
  nodeData: any,
  onCache: (hasCache: boolean) => void,
  onProgress: (progress: number, scanned: number, total: number) => void,
  onSuccess: (data: any) => void,
  onError: () => void,
) {
  const res = await fetch(nodeData.nodeUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_info'}),
  });

  const currentHeight = (await res.json()).result.height;
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
    try {
      let wallet;
      const localData = await idbOperation('readonly', get(identity).id);

      if (localData) {
        onCache(true);
        wallet = await monerots.openWalletFull({
          fs: {promises: {stat: () => Promise.reject(new Error('Memory'))}} as any,
          networkType: monerots.MoneroNetworkType.MAINNET,
          server: {uri: nodeData.nodeUrl},
          password: 'shadowself_xmr',
          keysData: localData.keys,
          cacheData: localData.cache,
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

      const daemonHeight = await wallet.getDaemonHeight();
      const totalBlocks = daemonHeight - restoreHeight;

      const progressTracker = setInterval(async () => {
        try {
          const currentHeight = await wallet.getHeight();

          let percent = 0;
          let scanned = 0;
          if (currentHeight >= restoreHeight && totalBlocks > 0) {
            scanned = currentHeight - restoreHeight;
            percent = (scanned / totalBlocks) * 100;
          }

          const displayPercent = Number(Math.max(0, Math.min(100, percent)).toFixed(2));
          onProgress(displayPercent, Math.max(0, scanned), Math.max(0, totalBlocks));
        } catch (e) {}
      }, 2000);

      await wallet.sync(undefined, undefined, true);
      clearInterval(progressTracker);

      const memoryBuffers = await wallet.getData();
      const keysData = memoryBuffers[0];
      const cacheData = memoryBuffers[1];

      await idbOperation('readwrite', get(identity).id, {keys: keysData, cache: cacheData});
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

      await wallet.close();
    } catch (e) {
      onError();
    }
  };

  processBlockchain();
  return initialState;
}
