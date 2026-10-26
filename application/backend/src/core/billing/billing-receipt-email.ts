import type {BillingReceipt} from '@type';
import {BILLING_PLAN_LABELS, BILLING_RECEIPT_NOTICE} from '@core/constants';
import {receiptAccessToken} from '@core/security';
import {emailConfig, origin} from '@core/config';

function escapeMarkup(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[character]!,
  );
}

export function receiptAmount(value: string, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number(value));
}

export function receiptRows(receipt: BillingReceipt) {
  const details = receipt.details;
  const date = (value: string) => new Date(value).toISOString().replace('T', ' ').replace('.000Z', ' UTC');
  const rows: [string, string][] = [
    ['Receipt', receipt.id],
    ['Paid', date(details.paidAt)],
    ['Identity', details.identityID],
    ['Plan', BILLING_PLAN_LABELS[details.plan]],
    ['Purchase', details.renewal ? 'Renewal' : 'New identity access'],
    ['Amount paid', receiptAmount(details.amount, details.currency)],
    ['Discount included', receiptAmount(details.discount, details.currency)],
    ['Tax', details.tax === null ? 'Not separately reported' : receiptAmount(details.tax, details.currency)],
    ['Payment method', details.paymentMethod],
    ['Payment reference', receipt.providerReference],
  ];

  if (details.periodStart) {
    rows.push(['Access starts', date(details.periodStart)]);
  }

  rows.push([
    'Access ends',
    details.periodEnd
      ? date(details.periodEnd)
      : details.plan === 'lifetime'
        ? 'Lifetime access'
        : 'See subscription billing details',
  ]);

  if (details.cryptoAmount && details.cryptoCoin) {
    rows.push(['Applied to identity access', `${details.cryptoAmount} ${details.cryptoCoin}`]);
  }

  if (details.providerInvoiceNumber) {
    rows.push(['Provider invoice', details.providerInvoiceNumber]);
  }

  return rows;
}

export function receiptPDF(lines: string[]) {
  const escaped = lines.flatMap((line) => {
    let remaining = line.normalize('NFKD').replace(/[^\x20-\x7e]/g, ' ');
    const wrapped: string[] = [];

    while (remaining.length > 88) {
      const space = remaining.lastIndexOf(' ', 88);
      const end = space > 0 ? space : 88;

      wrapped.push(remaining.slice(0, end));
      remaining = remaining.slice(end).trimStart();
    }

    wrapped.push(remaining);

    return wrapped.map((part) => part.replace(/[\\()]/g, '\\$&'));
  });
  const stream = `BT /F1 11 Tf 48 790 Td 16 TL\n${escaped.map((line) => `(${line}) Tj T*`).join('\n')}\nET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let document = '%PDF-1.4\n';
  const offsets = [0];

  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(document));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xref = Buffer.byteLength(document);

  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  return Buffer.from(document);
}

export function billingReceiptPDF(receipt: BillingReceipt) {
  const title = receipt.details.renewal ? 'Identity renewal receipt' : 'Identity purchase receipt';

  return receiptPDF([
    'ShadowSelf',
    title,
    '',
    ...receiptRows(receipt).map(([label, value]) => `${label}: ${value}`),
    '',
    BILLING_RECEIPT_NOTICE,
    `Billing support: ${emailConfig.contactAddress}`,
  ]);
}

export function billingReceiptEmail(receipt: BillingReceipt, role: 'account' | 'identity', recipient: string) {
  const title = receipt.details.renewal ? 'Identity renewal receipt' : 'Identity purchase receipt';
  const receiptURL = new URL(`/purchase/receipts/${receipt.id}`, origin);

  receiptURL.searchParams.set('access', receiptAccessToken(receipt.id, role));

  const link = receiptURL.href;
  const rows = receiptRows(receipt);
  const footer = BILLING_RECEIPT_NOTICE;
  const text = [
    'ShadowSelf',
    title,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `View receipt: ${link}`,
    '',
    footer,
    `Billing support: ${emailConfig.contactAddress}`,
  ].join('\n');
  const table = rows
    .map(
      ([label, value]) =>
        `<tr><th scope="row" style="padding:9px 0;text-align:left;vertical-align:top;font-weight:normal;color:#5d667c;width:42%;">${escapeMarkup(label)}</th><td style="padding:9px 0;color:#182033;overflow-wrap:anywhere;">${escapeMarkup(value)}</td></tr>`,
    )
    .join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#eef0f6;font-family:Arial,Helvetica,sans-serif;color:#182033;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #d9deea;">
<tr><td style="padding:24px 28px;background:#101629;color:#f4f3ff;font-size:22px;font-weight:bold;">ShadowSelf</td></tr>
<tr><td style="padding:28px;"><h1 style="margin:0 0 20px;font-size:24px;">${title}</h1><p style="font-size:16px;line-height:24px;">Payment confirmed. Your receipt is attached as a PDF.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:22px;border-collapse:collapse;">${table}</table>
<p style="margin-top:24px;"><a href="${escapeMarkup(link)}" style="color:#5140a5;">View receipt in ShadowSelf</a></p><p style="font-size:13px;color:#5d667c;">Open your receipt directly. No sign-in or password is needed.</p>
<p style="font-size:13px;line-height:21px;color:#5d667c;">${footer}</p><p style="font-size:13px;">Billing support: <a href="mailto:${escapeMarkup(emailConfig.contactAddress)}" style="color:#5140a5;">${escapeMarkup(emailConfig.contactAddress)}</a></p></td></tr></table></td></tr></table></body></html>`;

  return {
    from: {name: 'ShadowSelf Billing', address: emailConfig.billingAddress},
    to: {address: recipient, name: ''},
    replyTo: emailConfig.contactAddress,
    messageId: `<receipt.${receipt.id}.${role}@${emailConfig.domain}>`,
    date: new Date(receipt.details.paidAt),
    subject: `ShadowSelf: ${title} ${receipt.id}`,
    text,
    html,
    headers: {'Auto-Submitted': 'auto-generated', 'X-Auto-Response-Suppress': 'All'},
    disableFileAccess: true,
    disableUrlAccess: true,
    attachments: [
      {
        filename: `shadowself-receipt-${receipt.id}.pdf`,
        contentType: 'application/pdf',
        content: billingReceiptPDF(receipt),
      },
    ],
  };
}
