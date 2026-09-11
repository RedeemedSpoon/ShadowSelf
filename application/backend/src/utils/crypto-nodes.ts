import {BTC_API, ETH_API, UTXO_GAP_LIMIT, UTXO_HARD_LIMIT, LTC_API, USDT_CONTRACT, XMR_NODE} from '@core/constants';
import type {CryptoWalletResponse, UTXOData, TransactionsHistory} from '@type';
import {xpubToAddress} from '@utils/cryptography';

export async function getUtxoData(coin: 'btc' | 'ltc', xpub: string): Promise<CryptoWalletResponse['btc']> {
  const baseUrl = coin === 'btc' ? BTC_API : LTC_API;
  let totalBalance = 0;
  let activeCount = 0;
  let gap = 0;

  let allUtxos: UTXOData = [];
  let allHistory: TransactionsHistory = [];

  try {
    for (let i = 0; i < UTXO_HARD_LIMIT; i++) {
      const address = xpubToAddress(coin, xpub, i);
      const infoRes = await fetch(`${baseUrl}/address/${address}`, {signal: AbortSignal.timeout(15_000)});
      if (!infoRes.ok) throw new Error('Address lookup failed');
      const info = await infoRes.json();
      for (const stats of [info.chain_stats, info.mempool_stats]) {
        if (!stats || !['tx_count', 'funded_txo_sum', 'spent_txo_sum'].every((key) => Number.isSafeInteger(stats[key]) && stats[key] >= 0)) {
          throw new Error('Invalid address response');
        }
      }

      const txCount = info.chain_stats.tx_count + info.mempool_stats.tx_count;
      if (txCount === 0) {
        gap++;
        if (gap >= UTXO_GAP_LIMIT) break;
        continue;
      }

      const utxoRes = await fetch(`${baseUrl}/address/${address}/utxo`, {signal: AbortSignal.timeout(15_000)});
      if (!utxoRes.ok) throw new Error('Unspent output lookup failed');
      const utxos = await utxoRes.json();
      if (
        !Array.isArray(utxos) ||
        utxos.some(
          (item) =>
            !/^[a-f0-9]{64}$/.test(item.txid) || !Number.isSafeInteger(item.vout) || item.vout < 0 || !Number.isSafeInteger(item.value) || item.value < 0,
        )
      )
        throw new Error('Invalid unspent outputs');

      gap = 0;
      activeCount = i + 1;

      const cs = info.chain_stats;
      const ms = info.mempool_stats;
      const addrBalance = (cs.funded_txo_sum - cs.spent_txo_sum + ms.funded_txo_sum - ms.spent_txo_sum) / 100_000_000;
      totalBalance += addrBalance;

      if (utxos.length > 0) {
        allUtxos = allUtxos.concat(
          utxos.map((u: any) => ({
            txid: u.txid,
            vout: u.vout,
            value: u.value,
            address: address,
            pathIndex: i,
          })),
        );
      }

      const txsRes = await fetch(`${baseUrl}/address/${address}/txs`, {signal: AbortSignal.timeout(15_000)});
      if (!txsRes.ok) throw new Error('Transaction lookup failed');
      const rawTxs = await txsRes.json();
      if (!Array.isArray(rawTxs)) throw new Error('Invalid transaction history');

      const addrHistory = rawTxs.map((tx: any): TransactionsHistory[number] => {
        let sent = 0;
        let received = 0;
        let counterparty = 'Unknown';

        tx.vin.forEach((vin: any) => {
          if (vin.prevout?.scriptpubkey_address === address) sent += vin.prevout.value;
          else counterparty = vin.prevout?.scriptpubkey_address;
        });

        tx.vout.forEach((vout: any) => {
          if (vout.scriptpubkey_address === address) received += vout.value;
          else if (sent > 0) counterparty = vout.scriptpubkey_address;
        });

        const net = received - sent;

        return {
          txid: tx.txid,
          type: net > 0 ? 'received' : 'sent',
          amount: Math.abs(net) / 100_000_000,
          date: new Date(tx.status.block_time ? tx.status.block_time * 1000 : Date.now()),
          counterparty: counterparty || 'Multiple',
        };
      });

      allHistory = allHistory.concat(addrHistory);
    }

    allHistory.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      status: 'Synced',
      balance: totalBalance,
      utxos: allUtxos,
      history: allHistory,
      activeCount: activeCount,
      nextIndex: activeCount,
    };
  } catch {
    throw new Error(`${coin.toUpperCase()} wallet data is unavailable`);
  }
}

export async function getEvmData(coin: 'eth' | 'usdt', address: string) {
  const ethBalanceUrl = `${ETH_API}?module=account&action=balance&address=${address}`;
  const usdtbalanceUrl = `${ETH_API}?module=account&action=tokenbalance&contractaddress=${USDT_CONTRACT}&address=${address}`;
  const balanceUrl = coin === 'eth' ? ethBalanceUrl : usdtbalanceUrl;

  const nonceUrl = `${ETH_API}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest`;
  const historyUrl = `${ETH_API}?module=account&action=${coin === 'eth' ? 'txlist' : 'tokentx'}&address=${address}${coin === 'usdt' ? `&contractaddress=${USDT_CONTRACT}` : ''}`;

  try {
    const [balRes, nonceRes, histRes] = await Promise.all([balanceUrl, nonceUrl, historyUrl].map((url) => fetch(url, {signal: AbortSignal.timeout(15_000)})));

    if (![balRes, nonceRes, histRes].every((response) => response.ok)) throw new Error('Wallet provider is unavailable');
    const balData = await balRes.json();
    const nonceData = await nonceRes.json();
    const histData = await histRes.json();

    if (balData.status !== '1' || !/^\d+$/.test(balData.result) || !/^0x[0-9a-f]+$/i.test(nonceData.result)) throw new Error('Invalid wallet balance or nonce');
    const balance = Number(balData.result) / (coin === 'eth' ? 1e18 : 1e6);
    const nonce = Number(BigInt(nonceData.result));
    if (!Number.isFinite(balance) || balance < 0 || !Number.isSafeInteger(nonce)) throw new Error('Invalid wallet values');
    if (!Array.isArray(histData.result) || (histData.status !== '1' && !(histData.status === '0' && histData.result.length === 0)))
      throw new Error('Invalid wallet history');

    let history: any[] = [];
    if (histData.status === '1' && Array.isArray(histData.result)) {
      history = histData.result.slice(0, 50).map((tx: any) => ({
        txid: tx.hash,
        type: tx.to.toLowerCase() === address.toLowerCase() ? 'received' : 'sent',
        counterparty: tx.to.toLowerCase() === address.toLowerCase() ? tx.from : tx.to,
        amount: parseFloat(tx.value) / (coin === 'usdt' ? 1e6 : 1e18),
        date: new Date(parseInt(tx.timeStamp) * 1000),
      }));
    }

    return {status: 'Synced', balance: balance || 0, nonce, history};
  } catch (cause) {
    throw new Error(`${coin.toUpperCase()} wallet data is unavailable`, {cause});
  }
}

export async function getXmrNode() {
  try {
    const response = await fetch(XMR_NODE, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({jsonrpc: '2.0', id: '0', method: 'get_info'}),
      signal: AbortSignal.timeout(15_000),
    });

    const info = (await response.json()).result;
    let status = 'Network Operational';

    if (info.status !== 'OK') status = 'Node Busy';
    if (info.offline) status = 'Node Offline';
    if (info.target_height > 0 && info.target_height - info.height > 5) {
      status = `Syncing (${info.height}/${info.target_height})`;
    }

    return {status, nodeUrl: XMR_NODE};
  } catch (_) {
    return {status: 'Network Error', nodeUrl: XMR_NODE};
  }
}
