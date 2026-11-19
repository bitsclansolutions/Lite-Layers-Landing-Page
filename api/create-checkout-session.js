import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
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

const isMissing = (err) => err?.code === 'resource_missing' || err?.statusCode === 404;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const uid = await verifyToken(req.headers.authorization);
  if (!uid) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });

  const { plan } = req.body || {};
  if (!PRICE_IDS[plan]) return res.status(400).json({ error: 'Invalid plan' });

  try {
    const userRef = db.collection('users').doc(uid);
    let userSnap  = await userRef.get();

    // Some accounts (e.g. Google sign-ins whose client-side profile write never
    // landed) have an Auth record but no Firestore doc. Create a free-plan doc
    // from the Auth record instead of refusing checkout.
    const authUser = await getAuth().getUser(uid);
    if (!userSnap.exists) {
      await userRef.set({
        email:                authUser.email || '',
        displayName:          authUser.displayName || '',
        photoURL:             authUser.photoURL || null,
        plan:                 'free',
        role:                 null,
        stripeCustomerId:     null,
        stripeSubscriptionId: null,
        subscriptionStatus:   null,
        currentPeriodEnd:     null,
        cancelAtPeriodEnd:    false,
        usagePeriodStart:     null,
        createdAt:            FieldValue.serverTimestamp(),
      });
      userSnap = await userRef.get();
    }

    const userData  = userSnap.data() || {};
    const userEmail = userData.email || authUser.email || undefined;
    let customerId  = userData.stripeCustomerId ?? null;

    const createCustomer = async () => {
      const customer = await stripe.customers.create({
        email: userEmail,
        name:  userData.displayName || authUser.displayName || undefined,
        metadata: { firebaseUID: uid },
      });
      await userRef.update({ stripeCustomerId: customer.id });
      return customer.id;
    };

    if (!customerId) {
      customerId = await createCustomer();
    } else {
      // The stored customer may belong to the other Stripe mode (test vs live)
      // or may have been deleted.
      try {
        const c = await stripe.customers.retrieve(customerId);
        if (c.deleted) customerId = await createCustomer();
      } catch (err) {
        if (!isMissing(err)) throw err;
        customerId = await createCustomer();
      }
    }

    // If the user already has a live subscription, switch its price in place
    // instead of creating a second one.
    const existingSubId = userData.stripeSubscriptionId ?? null;
    if (existingSubId) {
      let existingSub = null;
      try {
        existingSub = await stripe.subscriptions.retrieve(existingSubId);
      } catch (err) {
        if (!isMissing(err)) throw err;
        await userRef.update({ stripeSubscriptionId: null }); // stale ID
      }

      if (existingSub && ['active', 'trialing', 'past_due'].includes(existingSub.status)) {
        // Errors here propagate: never fall through to a second checkout while
        // the first subscription is still billing.
        await stripe.subscriptions.update(existingSubId, {
          items: [{ id: existingSub.items.data[0].id, price: PRICE_IDS[plan] }],
          proration_behavior: 'always_invoice',
          metadata: { firebaseUID: uid, plan },
        });
        return res.status(200).json({ url: `${process.env.APP_URL}/dashboard?tab=billing&upgraded=true` });
      }

      if (existingSub && ['canceled', 'incomplete_expired'].includes(existingSub.status)) {
        await userRef.update({ stripeSubscriptionId: null });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.APP_URL}/dashboard?tab=billing`,
      client_reference_id: uid,
      subscription_data: {
        metadata: { firebaseUID: uid, plan },
      },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session]', uid, plan, err?.type || '', err?.code || '', err?.message);
    return res.status(500).json({ error: err?.message || 'Checkout failed' });
  }
}
