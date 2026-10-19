import autoTable from 'jspdf-autotable';
import {jsPDF} from 'jspdf';
import {formatUnits, parseUnits} from 'viem';
import {COIN_DECIMALS, SITE_HOST} from '$constant';
import type {Coins, InvoiceIdentity, InvoiceClient, InvoiceTable, InvoicePayment} from '$type';

export function invoiceAmount(coin: Coins, cents: number, rate: number) {
  if (!Number.isSafeInteger(cents) || cents <= 0 || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('A positive invoice total and exchange rate are required.');
  }

  const price = parseUnits(rate.toFixed(12), 12);

  if (price <= 0n) {
    throw new Error('The exchange rate is below supported precision.');
  }

  const decimals = COIN_DECIMALS[coin];
  const numerator = BigInt(cents) * 10n ** BigInt(decimals) * 10n ** 12n;
  const denominator = price * 100n;

  return formatUnits((numerator + denominator - 1n) / denominator, decimals);
}

export function generatePDF(
  identityData: InvoiceIdentity,
  clientData: InvoiceClient,
  tableData: InvoiceTable,
  cryptoData: InvoicePayment,
) {
  const doc = new jsPDF();

  const colorText = '#3c4257';
  const colorSub = '#697386';

  doc.setFont('helvetica');
  doc.setTextColor(colorText);

  const startY = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(identityData.name, 20, startY + 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 190, startY + 5, {align: 'right'});

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSub);
  doc.text(`#${identityData.invoice}`, 190, startY + 10, {align: 'right'});
  doc.text(`Issued: ${identityData.date}`, 190, startY + 15, {align: 'right'});
  doc.text(`Due: ${identityData.dateDue}`, 190, startY + 20, {align: 'right'});

  const addrY = startY + 30;
  doc.setTextColor(colorText);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('From:', 20, addrY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSub);
  doc.text(identityData.name, 20, addrY + 5);
  doc.text(identityData.email, 20, addrY + 10);

  doc.setTextColor(colorText);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 100, addrY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSub);
  doc.text(clientData.clientName || 'Valued Client', 100, addrY + 5);

  if (clientData.clientEmail) {
    doc.text(clientData.clientEmail, 100, addrY + 10);
  }

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorText);
  doc.text(`$${tableData.totalTransactionPrice.toFixed(2)}`, 190, addrY + 12, {align: 'right'});

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSub);
  doc.text('USD due', 190, addrY + 18, {align: 'right'});

  const bodyData = tableData.tableRows.map((row) => [
    row.description,
    row.quantity,
    `$${row.price.toFixed(2)}`,
    `$${row.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: addrY + 25,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: bodyData,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 4,
      textColor: colorText,
    },
    headStyles: {
      fillColor: [247, 250, 252],
      textColor: colorSub,
      fontStyle: 'bold',
      lineWidth: 0,
    },
    columnStyles: {
      0: {cellWidth: 'auto'},
      3: {halign: 'right', fontStyle: 'bold'},
    },
    foot: [['', '', 'Total', `$${tableData.totalTransactionPrice.toFixed(2)}`]],
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: colorText,
      halign: 'right',
      fontStyle: 'bold',
      fontSize: 12,
    },
  });

  let finalY = ((doc as jsPDF & {lastAutoTable: {finalY: number}}).lastAutoTable.finalY || 100) + 15;

  if (finalY > 230) {
    doc.addPage();
    finalY = 20;
  }

  doc.setDrawColor(230, 230, 230);
  doc.line(20, finalY, 190, finalY);

  const payY = finalY + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorText);
  doc.text('Payment Instructions', 20, payY + 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSub);
  doc.text(`Please make payment via ${cryptoData.cryptoChoice.toUpperCase()} Network.`, 20, payY + 12);
  doc.text(
    `Reference rate: 1 ${cryptoData.cryptoChoice.toUpperCase()} = $${cryptoData.exchangeRate.toFixed(2)}`,
    20,
    payY + 18,
  );

  doc.setFontSize(14);
  doc.setTextColor(colorText);
  doc.setFont('helvetica', 'bold');

  doc.text(`${cryptoData.cryptoDue} ${cryptoData.cryptoChoice.toUpperCase()}`, 20, payY + 28);

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(colorText);

  const formattedAddress = cryptoData.destAddr.match(/.{1,45}/g)?.join('\n') || cryptoData.destAddr;
  doc.text(formattedAddress, 20, payY + 36);

  if (cryptoData.qrImage) {
    doc.addImage(cryptoData.qrImage, 'PNG', 150, payY, 35, 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colorSub);
    doc.text('Scan to Pay', 167.5, payY + 40, {align: 'center'});
  }

  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generated via ${SITE_HOST} | Invoice #${identityData.invoice}`, 105, 290, {align: 'center'});

  const safeName = clientData.clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'invoice';
  doc.save(`${safeName}_${identityData.invoice}.pdf`);
}
