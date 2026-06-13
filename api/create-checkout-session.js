import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyToken } from './_verify-token.js';

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = getFirestore();

const PRICE_IDS = {
  pro:      process.env.STRIPE_PRO_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const uid = await verifyToken(req.headers.authorization);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  const { plan } = req.body;

  if (!PRICE_IDS[plan]) return res.status(400).json({ error: 'Invalid plan' });

  const userId = uid;

  const userRef  = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
  let customerId = userSnap.data()?.stripeCustomerId ?? null;
  const userEmail = userSnap.data()?.email ?? '';

  const createCustomer = async () => {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { firebaseUID: userId },
    });
    await userRef.update({ stripeCustomerId: customer.id });
    return customer.id;
  };

  if (!customerId) {
    customerId = await createCustomer();
  } else {
    // Verify the customer exists in the current Stripe mode (live vs test)
    try {
      await stripe.customers.retrieve(customerId);
    } catch {
      customerId = await createCustomer();
    }
  }

  // If the user already has an active subscription, update it in place
  // instead of creating a second one.
  const existingSubId = userSnap.data()?.stripeSubscriptionId ?? null;
  if (existingSubId) {
    try {
      const existingSub = await stripe.subscriptions.retrieve(existingSubId);
      if (['active', 'trialing', 'past_due'].includes(existingSub.status)) {
        await stripe.subscriptions.update(existingSubId, {
          items: [{ id: existingSub.items.data[0].id, price: PRICE_IDS[plan] }],
          proration_behavior: 'always_invoice',
          metadata: { firebaseUID: userId, plan },
        });
        return res.status(200).json({ url: `${process.env.APP_URL}/dashboard?tab=billing&upgraded=true` });
      }
      // Sub exists in Stripe but is canceled/expired — clear the stale ID so
      // the checkout below creates a fresh subscription cleanly.
      if (['canceled', 'incomplete_expired'].includes(existingSub.status)) {
        await userRef.update({ stripeSubscriptionId: null });
      }
    } catch {
      // Sub not found in Stripe at all — clear the stale ID and fall through.
      await userRef.update({ stripeSubscriptionId: null });
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.APP_URL}/dashboard?tab=billing`,
      subscription_data: {
        metadata: { firebaseUID: userId, plan },
      },
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
