import autoTable from 'jspdf-autotable';
import {jsPDF} from 'jspdf';

export function generatePDF(identityData: any, clientData: any, tableData: any, cryptoData: any) {
  const doc = new jsPDF();

  const colorText = '#3c4257';
  const colorSub = '#697386';

  doc.setFont('helvetica');
  doc.setTextColor(colorText);

  // --- 1. HEADER (Logo + Invoice Meta) ---
  let startY = 20;

  // Logo (Top Left)
  if (identityData.logo) {
    doc.addImage(identityData.logo, 'PNG', 20, startY, 25, 25);
  } else {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(identityData.name, 20, startY + 10);
  }

  // Invoice Details (Top Right)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 190, startY + 5, {align: 'right'});

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSub);
  doc.text(`#${identityData.invoice}`, 190, startY + 10, {align: 'right'});
  doc.text(`Issued: ${identityData.date}`, 190, startY + 15, {align: 'right'});
  doc.text(`Due: ${identityData.dateDue}`, 190, startY + 20, {align: 'right'});

  // --- 2. ADDRESSES (From / To) ---
  const addrY = startY + 30;
  doc.setTextColor(colorText);

  // From (Identity)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('From:', 20, addrY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSub);
  doc.text(identityData.name, 20, addrY + 5);
  doc.text(identityData.email, 20, addrY + 10);

  // Bill To (Client)
  doc.setTextColor(colorText);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 100, addrY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSub);
  doc.text(clientData.clientName || 'Valued Client', 100, addrY + 5);
  if (clientData.clientEmail) doc.text(clientData.clientEmail, 100, addrY + 10);

  // --- 3. BIG TOTAL (Hero Section) ---
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorText);
  doc.text(`$${tableData.totalTransactionPrice.toFixed(2)}`, 190, addrY + 12, {align: 'right'});

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSub);
  doc.text('USD due', 190, addrY + 18, {align: 'right'});

  // --- 4. TABLE ---
  const bodyData = tableData.tableRows.map((row: any) => [
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

  // --- 5. CRYPTO PAYMENT SECTION ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 15;
  if (finalY > 230) {
    doc.addPage();
    finalY = 20;
  }

  // Container Box (Optional visuals)
  doc.setDrawColor(230, 230, 230);
  doc.line(20, finalY, 190, finalY);

  const payY = finalY + 10;

  // -- Left Side: Instructions --
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colorText);
  doc.text('Payment Instructions', 20, payY + 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colorSub);
  doc.text(`Please make payment via ${cryptoData.cryptoChoice.toUpperCase()} Network.`, 20, payY + 12);
  doc.text(`Exchange Rate locked: 1 ${cryptoData.cryptoChoice.toUpperCase()} = $${cryptoData.exchangeRate.toFixed(2)}`, 20, payY + 18);

  // The Big Crypto Amount
  doc.setFontSize(14);
  doc.setTextColor(colorText);
  doc.setFont('helvetica', 'bold');

  const cryptoDisplay = cryptoData.cryptoChoice === 'usdt' ? cryptoData.cryptoDue.toFixed(2) : cryptoData.cryptoDue.toFixed(6);
  doc.text(`${cryptoDisplay} ${cryptoData.cryptoChoice.toUpperCase()}`, 20, payY + 28);

  // Address (Monospace)
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(colorText);

  const formattedAddress = cryptoData.destAddr.match(/.{1,45}/g)?.join('\n') || cryptoData.destAddr;
  doc.text(formattedAddress, 20, payY + 36);

  // -- Right Side: QR Code --
  if (cryptoData.qrImage) {
    doc.addImage(cryptoData.qrImage, 'PNG', 150, payY, 35, 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colorSub);
    doc.text('Scan to Pay', 167.5, payY + 40, {align: 'center'});
  }

  // --- FOOTER ---
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generated via ShadowSelf.io | Invoice #${identityData.invoice}`, 105, 290, {align: 'center'});

  // Save
  const safeName = clientData.clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'invoice';
  doc.save(`${safeName}_${identityData.invoice}.pdf`);
}
