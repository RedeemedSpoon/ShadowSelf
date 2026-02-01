import type {Coins, UTXOData} from '$type';

// --- MAGIC NUMBERS (WEIGHTS) ---
const VBYTE_INPUT = 68;
const VBYTE_OUTPUT = 31;
const VBYTE_OVERHEAD = 10;

const GAS_ETH_TRANSFER = 21_000;
const GAS_ERC20_TRANSFER = 65_000;

export function selectBestUtxos(availableUtxos: UTXOData, amount: number, feeRate: number): UTXOData {
  const targetSats = Math.floor(amount * 100_000_000);
  const sorted = [...availableUtxos].sort((a, b) => b.value - a.value);

  const selected: UTXOData = [];
  let totalValue = 0;

  for (const utxo of sorted) {
    selected.push(utxo);
    totalValue += utxo.value;

    const currentBytes = VBYTE_OVERHEAD + selected.length * VBYTE_INPUT + 2 * VBYTE_OUTPUT;
    const currentFee = Math.ceil(currentBytes * feeRate);

    if (totalValue >= targetSats + currentFee) {
      return selected;
    }
  }

  return sorted;
}

export function estimateTransactionFee(coin: Coins, inputs: UTXOData, feeRate: number, amount: number) {
  if (!amount || amount <= 0) {
    return {fee: 0, unit: coin === 'usdt' ? 'ETH' : coin.toUpperCase(), size: 0, sizeUnit: ''};
  }

  if (coin === 'eth' || coin === 'usdt') {
    const gasLimit = coin === 'eth' ? GAS_ETH_TRANSFER : GAS_ERC20_TRANSFER;
    const feeInEth = (gasLimit * feeRate) / 1_000_000_000;

    return {
      fee: feeInEth,
      unit: 'ETH',
      size: gasLimit,
      sizeUnit: 'Gas',
    };
  }

  if (coin === 'btc' || coin === 'ltc') {
    if (!inputs || inputs.length === 0) {
      return {fee: 0, unit: coin.toUpperCase(), size: 0, sizeUnit: 'vBytes'};
    }

    const amountSats = Math.floor(amount * 100_000_000);
    const inputTotalSats = inputs.reduce((acc, curr) => acc + curr.value, 0);

    const sizeWithChange = VBYTE_OVERHEAD + inputs.length * VBYTE_INPUT + 2 * VBYTE_OUTPUT;
    const feeWithChange = Math.ceil(sizeWithChange * feeRate);

    const remaining = inputTotalSats - amountSats - feeWithChange;
    const dustLimit = coin === 'btc' ? 546 : 1000;

    let finalSize = sizeWithChange;
    let finalFee = feeWithChange;

    if (remaining < dustLimit) {
      finalSize = VBYTE_OVERHEAD + inputs.length * VBYTE_INPUT + 1 * VBYTE_OUTPUT;
      finalFee = Math.ceil(finalSize * feeRate);
    }

    return {
      fee: finalFee / 100_000_000,
      unit: coin.toUpperCase(),
      size: finalSize,
      sizeUnit: 'vBytes',
    };
  }

  return {fee: 0, unit: '', size: 0, sizeUnit: ''};
}
