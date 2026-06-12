import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { verifyAdmin } from './_verify-admin.js';

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}
const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY);
const db        = getFirestore();
const adminAuth = getAuth();

async function deleteSubcollections(docRef) {
  const collections = await docRef.listCollections();
  for (const col of collections) {
    const snap = await col.get();
    if (snap.empty) continue;
    const chunks = [];
    snap.docs.forEach((d, i) => {
      if (i % 500 === 0) chunks.push([]);
      chunks[chunks.length - 1].push(d.ref);
    });
    for (const chunk of chunks) {
      const batch = db.batch();
      chunk.forEach(ref => batch.delete(ref));
      await batch.commit();
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const adminUid = await verifyAdmin(req.headers.authorization);
  if (!adminUid) return res.status(403).json({ error: 'Admin access required' });

  const { userId } = req.body ?? {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (userId === adminUid) return res.status(400).json({ error: 'Cannot delete your own admin account' });

  const userRef  = db.collection('users').doc(userId);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    const userData = userSnap.data();

    if (userData.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
        if (!['canceled', 'incomplete_expired'].includes(sub.status)) {
          await stripe.subscriptions.cancel(userData.stripeSubscriptionId);
        }
      } catch (err) {
        if (err.code !== 'resource_missing') {
          return res.status(500).json({ error: `Stripe cancellation failed: ${err.message}` });
        }
      }
    }

    await deleteSubcollections(userRef);
    await userRef.delete();
  }

  try {
    await adminAuth.deleteUser(userId);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') {
      return res.status(500).json({ error: `Auth deletion failed: ${err.message}` });
    }
  }

  return res.status(200).json({ success: true });
}
