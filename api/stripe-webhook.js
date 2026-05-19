import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const config = { api: { bodyParser: false } };

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = getFirestore();

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
  const priceId = sub.items.data[0]?.price.id;
  const plan    = PLAN_BY_PRICE[priceId] || 'free';
  await db.collection('users').doc(uid).update({
    plan,
    stripeSubscriptionId: sub.id,
    subscriptionStatus:   sub.status,
    currentPeriodEnd:     Timestamp.fromMillis(sub.current_period_end * 1000),
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
    case 'customer.subscription.updated':
      await syncSubscription(event.data.object);
      break;

    case 'customer.subscription.deleted': {
      const uid = event.data.object.metadata?.firebaseUID;
      if (uid) {
        await db.collection('users').doc(uid).update({
          plan: 'free', stripeSubscriptionId: null,
          subscriptionStatus: 'canceled', currentPeriodEnd: null,
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const cid   = event.data.object.customer;
      const snap  = await db.collection('users').where('stripeCustomerId', '==', cid).limit(1).get();
      if (!snap.empty) await snap.docs[0].ref.update({ subscriptionStatus: 'past_due' });
      break;
    }
  }

  res.status(200).json({ received: true });
}
