import {Elysia} from 'elysia';
import {sql} from '@core/services';
import {UUID_PATTERN} from '@core/constants';
import {ApiError, verifyReceiptAccess} from '@core/security';
import {billingReceiptPDF} from '@core/billing/billing-receipt-email';
import {receiptFromRecord} from '@core/billing/billing-receipts';
import type {BillingReceiptRecord} from '@type';

async function receiptFromLink(id: string, access: string) {
  if (!UUID_PATTERN.test(id) || !verifyReceiptAccess(id, access)) {
    throw new ApiError(404, 'receipt_not_found', 'This receipt link is invalid. Open the link in your billing email.');
  }

  const rows = await sql`SELECT id, provider, provider_reference, details FROM billing_receipts WHERE id = ${id}`;

  if (!rows[0]) {
    throw new ApiError(404, 'receipt_not_found', 'Receipt not found');
  }

  return receiptFromRecord(rows[0] as BillingReceiptRecord);
}

export default new Elysia({prefix: '/api/billing/receipts'})
  .onAfterHandle(({set}) => {
    set.headers['cache-control'] = 'no-store';
    set.headers['referrer-policy'] = 'no-referrer';
    set.headers['x-robots-tag'] = 'noindex, nofollow';
  })
  .get('/:id', ({params, query}) => receiptFromLink(params.id, query.access || ''))
  .get('/:id/pdf', async ({params, query}) => {
    const receipt = await receiptFromLink(params.id, query.access || '');

    return new Response(billingReceiptPDF(receipt), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="shadowself-receipt-${receipt.id}.pdf"`,
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  });
