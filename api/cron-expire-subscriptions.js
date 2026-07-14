import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = getFirestore();

// Safety net for api/stripe-webhook.js's customer.subscription.deleted handler —
// downgrades any user whose cancelAtPeriodEnd window has closed but whose
// Firestore doc wasn't updated (e.g. a missed/delayed webhook), so plan-based
// usage limits (see LIMITS in DashboardPage.jsx) apply correctly going forward.
export default async function handler(req, res) {
  // Vercel sends this header on cron-triggered requests when CRON_SECRET is set.
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Single equality filter only, to avoid requiring a Firestore composite index —
  // the period-end comparison happens in memory below.
  const snap = await db.collection('users').where('cancelAtPeriodEnd', '==', true).get();

  const now = Date.now();
  let checked = 0;
  let expired = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const periodEndMs = data.currentPeriodEnd?.seconds ? data.currentPeriodEnd.seconds * 1000 : null;
    if (periodEndMs === null || periodEndMs > now) continue;

    checked++;

    // Confirm with Stripe before downgrading — protects against a stale
    // currentPeriodEnd if the subscription was renewed/reactivated since.
    if (data.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(data.stripeSubscriptionId);
        if (['active', 'trialing', 'past_due'].includes(sub.status) && !sub.cancel_at_period_end) {
          continue;
        }
      } catch {
        // Not found in Stripe — already gone, safe to downgrade below.
      }
    }

    await docSnap.ref.update({
      plan: 'free',
      stripeSubscriptionId: null,
      subscriptionStatus: 'canceled',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    expired++;
  }

  res.status(200).json({ scanned: snap.size, checked, expired });
}
