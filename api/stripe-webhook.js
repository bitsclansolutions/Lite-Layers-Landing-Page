import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const config = { api: { bodyParser: false } };

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = getFirestore();

async function logEvent(uid, email, eventType, plan, status) {
  try {
    await db.collection('subscription_events').add({
      uid: uid ?? null,
      email: email ?? null,
      eventType,
      plan: plan ?? null,
      status: status ?? null,
      timestamp: Timestamp.now(),
    });
  } catch { /* non-fatal */ }
}

const PLAN_BY_PRICE = {
  [process.env.STRIPE_PRO_PRICE_ID]:      'pro',
  [process.env.STRIPE_BUSINESS_PRICE_ID]: 'business',
};

async function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function syncSubscription(sub) {
  const uid = sub.metadata?.firebaseUID;
  if (!uid) return;

  // incomplete is transient — payment hasn't cleared yet.
  // customer.subscription.updated will fire once it becomes active.
  if (sub.status === 'incomplete') return;

  const priceId = sub.items.data[0]?.price.id;

  const hasAccess = ['active', 'trialing', 'past_due'].includes(sub.status);
  const plan = hasAccess ? (PLAN_BY_PRICE[priceId] || 'free') : 'free';

  // usagePeriodStart drives which Firestore usage doc is "current".
  // When Stripe renews the subscription a new current_period_start arrives,
  // automatically pointing usage reads/writes at a fresh document.
  const usagePeriodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000).toISOString().split('T')[0]
    : null;

  await db.collection('users').doc(uid).update({
    plan,
    stripeSubscriptionId: sub.id,
    subscriptionStatus:   sub.status,
    cancelAtPeriodEnd:    sub.cancel_at_period_end ?? false,
    currentPeriodEnd:     sub.current_period_end
      ? Timestamp.fromMillis(sub.current_period_end * 1000)
      : null,
    usagePeriodStart,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = await rawBody(req);
  const sig  = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      await syncSubscription(sub);
      const uid = sub.metadata?.firebaseUID;
      const priceId = sub.items.data[0]?.price.id;
      const plan = PLAN_BY_PRICE[priceId] || 'free';
      if (uid) await logEvent(uid, null, event.type, plan, sub.status);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const uid = sub.metadata?.firebaseUID;
      if (uid) {
        await db.collection('users').doc(uid).update({
          plan: 'free', stripeSubscriptionId: null,
          subscriptionStatus: 'canceled', currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        });
        await logEvent(uid, null, 'subscription.deleted', 'free', 'canceled');
      }
      break;
    }

    case 'invoice.payment_failed': {
      const cid  = event.data.object.customer;
      const snap = await db.collection('users').where('stripeCustomerId', '==', cid).limit(1).get();
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        await userDoc.ref.update({ subscriptionStatus: 'past_due' });
        await logEvent(userDoc.id, userDoc.data().email, 'payment.failed', userDoc.data().plan, 'past_due');
      }
      break;
    }

    // Payment recovered after past_due — restore active status immediately
    case 'invoice.paid': {
      const inv = event.data.object;
      // Only care about subscription invoices, not one-off charges
      const handledReasons = ['subscription_cycle', 'subscription_create', 'subscription_update'];
      if (!handledReasons.includes(inv.billing_reason)) break;
      const subId = inv.subscription;
      if (!subId) break;
      const sub = await stripe.subscriptions.retrieve(subId);
      await syncSubscription(sub);
      const uid = sub.metadata?.firebaseUID;
      const priceId = sub.items.data[0]?.price.id;
      const plan = PLAN_BY_PRICE[priceId] || 'free';
      if (uid) await logEvent(uid, null, 'payment.recovered', plan, 'active');
      break;
    }
  }

  res.status(200).json({ received: true });
}
