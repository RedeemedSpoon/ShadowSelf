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

class SyncListener extends monerots.MoneroWalletListener {
  private updateProgress: (percent: number) => void;

  constructor(updateProgress: (percent: number) => void) {
    super();
    this.updateProgress = updateProgress;
  }

  async onSyncProgress(height: number, startHeight: number, endHeight: number, percentDone: number): Promise<void> {
    let calculated = 0;
    if (endHeight > startHeight) {
      calculated = ((height - startHeight) / (endHeight - startHeight)) * 100;
    }

    const finalPercent = Math.floor(calculated || percentDone * 100);

    console.log(`[XMR Sync] Block ${height} / ${endHeight} - ${finalPercent}%`);
    this.updateProgress(finalPercent);
  }
}

export default async function initMoneroScan(
  nodeData: any,
  onCache: (hasCache: boolean) => void,
  onProgress: (progress: number) => void,
  onSuccess: (data: any) => void,
  onError: () => void,
) {
  const genesisMs = 1397818133000;
  const startMs = new Date(nodeData.startingDate).getTime();
  const restoreHeight = Math.max(0, Math.floor((startMs - genesisMs) / 120000) - 10000);

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

      const listener = new SyncListener((percentDone) => {
        onProgress(percentDone);
      });

      await wallet.sync(listener);

      const memoryBuffers = await wallet.getData();
      const keysData = memoryBuffers[0];
      const cacheData = memoryBuffers[1];

      await idbOperation('readwrite', get(identity).id, {keys: keysData, cache: cacheData});
      const [balance, unlocked, txs] = await Promise.all([wallet.getBalance(), wallet.getUnlockedBalance(), wallet.getTxs()]);

      const history = txs
        .map((tx: any) => {
          const incoming = Number(tx.getIncomingAmount() || 0);
          const outgoing = Number(tx.getOutgoingAmount() || 0);

          return {
            txid: String(tx.getHash()),
            type: (incoming > outgoing ? 'received' : 'sent') as 'sent',
            counterparty: 'RingCT Hidden',
            amount: Math.abs(incoming - outgoing) / 1e12,
            date: new Date((tx.getTimestamp() || Math.floor(Date.now() / 1000)) * 1000),
          };
        })
        .sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

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
