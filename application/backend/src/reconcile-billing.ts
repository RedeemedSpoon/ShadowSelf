import {recoverStripeEvents} from '@core/stripe-service';
import {repairIdentityDeletions} from '@core/identity-service';
import {sql, stripe} from '@core/services';

const since = new Date(process.argv[2] || '').getTime();
if (!Number.isFinite(since) || since > Date.now() || since < Date.now() - 30 * 86_400_000) {
  throw new Error('Provide an ISO start date within the last 30 days');
}

try {
  const intents = await sql`SELECT f.*, u.stripe_customer FROM fiat_intents f JOIN users u ON u.id = f.owner WHERE f.provider_id IS NULL`;
  for (const intent of intents) {
    if (!intent.stripe_customer) {
      console.error(`Payment request ${intent.id} has no billing customer; manual review required`);
      continue;
    }

    const matches: string[] = [];
    if (intent.plan === 'lifetime') {
      for await (const payment of stripe.paymentIntents.list({customer: intent.stripe_customer, limit: 100})) {
        if (payment.metadata.id === intent.identity_id) matches.push(payment.id);
      }
      if (matches.length === 1) await sql`UPDATE fiat_intents SET provider_id = ${matches[0]} WHERE id = ${intent.id} AND provider_id IS NULL`;
    } else {
      for await (const subscription of stripe.subscriptions.list({customer: intent.stripe_customer, status: 'all', limit: 100})) {
        if (subscription.metadata.id === intent.identity_id) matches.push(subscription.id);
      }
      if (matches.length === 1) await sql`UPDATE fiat_intents SET subscription_id = ${matches[0]} WHERE id = ${intent.id} AND subscription_id IS NULL`;
    }
    if (matches.length !== 1) console.error(`Payment request ${intent.id} requires manual review; found ${matches.length} matching provider objects`);
  }

  await recoverStripeEvents(Math.floor(since / 1000));
  await repairIdentityDeletions();
  const unresolved = await sql`SELECT id FROM crypto_invoices WHERE provider_state = 'requested' AND response IS NULL`;
  for (const invoice of unresolved) console.error(`Swap invoice ${invoice.id} requires provider reconciliation before another payment request`);
} finally {
  await sql.end({timeout: 5});
}
