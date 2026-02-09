<script lang="ts">
  import type {APIResponse, Coins} from '$type';
  import type {Writable} from 'svelte/store';
  import {deriveXPub} from '$cryptography';
  import {identity} from '$store';
  import {receipt} from '$image';
  import QRCode from 'qrcode';
  import {notify} from '$lib';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'market' | 'swap'>;
    cryptoTitles: {[key: string]: string};
    crypto: APIResponse;
  }

  let {mode, cryptoTitles, crypto}: Props = $props();

  let dueDate = $state(14);
  let logoUrl = $state('');
  let logoFiles = $state([]);
  let clientEmail = $state('');
  let clientName = $state('');
  let useNewAddr = $state(true);
  let useMainAddr = $state(true);
  let cryptoChoice = $state('btc') as Coins;
  const pdfTableRows = $state() as HTMLTableElement;

  async function getBase64Img(logoFiles: any, logoUrl: string) {
    let logo = '';

    if (logoFiles && logoFiles.length > 0) {
      logo = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(logoFiles[0]);
      });
    } else if (logoUrl) {
      try {
        const res = await fetch(logoUrl);
        const blob = await res.blob();
        logo = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        notify('Logo URL parsing failed, check the link again', 'alert');
        logo = '';
      }
    }

    if (!logo) {
      const res = await fetch(receipt);
      const blob = await res.blob();
      logo = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    return logo;
  }

  async function gatherPDFData() {
    const {name, email} = $identity;

    const now = new Date();
    const dueObj = new Date();
    dueObj.setDate(now.getDate() + (dueDate || 0));

    const date = now.toLocaleDateString();
    const dateDue = dueObj.toLocaleDateString();
    const invoice = Math.floor(Math.random() * 1e6);
    const logo = getBase64Img(logoFiles, logoUrl);

    if (!pdfTableRows) return;
    const tableRows = [...pdfTableRows.querySelectorAll('tr')].map((row) => {
      const descInput = row.querySelector('[name="description"]') as HTMLInputElement;
      const qtyInput = row.querySelector('[name="quantity"]') as HTMLInputElement;
      const priceInput = row.querySelector('[name="price"]') as HTMLInputElement;

      const description = descInput?.value || '';
      const quantity = Number(qtyInput?.value || 0);
      const price = Number(priceInput?.value || 0);
      const total = quantity * price;

      return {description, quantity, price, total};
    });

    const totalTransactionPrice = tableRows.reduce((sum, row) => sum + row.total, 0);
    const exchangeRate = crypto.prices[cryptoChoice].to_usd;

    const cryptoDue = totalTransactionPrice / exchangeRate;

    let destAddr = $identity.wallet_keys.evm;
    if (['btc', 'ltc'].includes(cryptoChoice)) {
      const xpub = $identity.wallet_keys[cryptoChoice as 'btc'];
      const nextIndex = crypto.wallet[cryptoChoice as 'btc'].next_index;
      const index = useMainAddr ? 0 : Math.max(0, useNewAddr ? nextIndex : nextIndex - 1);
      destAddr = deriveXPub(cryptoChoice, xpub, index);
    }

    let uri = destAddr;
    if (cryptoChoice === 'btc') uri = `bitcoin:${destAddr}?amount=${cryptoDue.toFixed(8)}`;
    else if (cryptoChoice === 'ltc') uri = `litecoin:${destAddr}?amount=${cryptoDue.toFixed(8)}`;
    else if (cryptoChoice === 'xmr') uri = `monero:${destAddr}?tx_amount=${cryptoDue.toFixed(12)}`;
    else uri = `ethereum:${destAddr}?value=${cryptoDue.toFixed(18)}`;

    const qrImage = await QRCode.toDataURL(uri, {width: 300, margin: 2});

    const identityData = {logo, name, email, invoice, date, dateDue};
    const cryptoData = {cryptoChoice, exchangeRate, cryptoDue, destAddr, qrImage};
    const tableData = {tableRows, totalTransactionPrice};
    const clientData = {clientName, clientEmail};

    generatePDF(identityData, clientData, tableData, cryptoData);
  }

  function generatePDF() {}
</script>

{#if $mode === 'market'}
  <h3>Spend & Discover</h3>
{:else if $mode === 'swap'}
  <h3>Swap Coins</h3>
{:else if $mode === 'invoice'}
  <h3>Generate PDF Invoice</h3>
{/if}
