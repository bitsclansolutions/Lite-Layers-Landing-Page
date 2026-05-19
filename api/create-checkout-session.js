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

const PRICE_IDS = {
  pro:      process.env.STRIPE_PRO_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { plan, userId, userEmail } = req.body;

  if (!PRICE_IDS[plan]) return res.status(400).json({ error: 'Invalid plan' });

  const userRef  = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  let customerId = userSnap.data()?.stripeCustomerId ?? null;

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
