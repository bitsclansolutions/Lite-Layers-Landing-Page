import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}

const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY);
const db        = getFirestore();
const adminAuth = getAuth();

// Recursively delete all documents in a subcollection
async function deleteSubcollections(docRef) {
  const collections = await docRef.listCollections();
  for (const col of collections) {
    const snap = await col.get();
    if (snap.empty) continue;
    // Firestore batch limit is 500 writes
    const chunks = [];
    snap.docs.forEach((doc, i) => {
      if (i % 500 === 0) chunks.push([]);
      chunks[chunks.length - 1].push(doc.ref);
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

  // Verify Firebase ID token — this is a destructive action
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  let uid;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Confirm the token UID matches the request body (prevent acting on another user)
  const { userId } = req.body ?? {};
  if (!userId || userId !== uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const userRef  = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    // User doc already gone — still clean up Auth
    try { await adminAuth.deleteUser(uid); } catch { /* already deleted */ }
    return res.status(200).json({ success: true });
  }

  const userData = userSnap.data();

  // ── 1. Cancel Stripe subscription immediately ──────────────────────────────
  // Covers both active and "cancelling" (cancelAtPeriodEnd=true) states.
  if (userData.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
      if (!['canceled', 'incomplete_expired'].includes(sub.status)) {
        await stripe.subscriptions.cancel(userData.stripeSubscriptionId);
      }
    } catch (err) {
      // resource_missing = already gone in Stripe — safe to continue
      if (err.code !== 'resource_missing') {
        return res.status(500).json({ error: `Stripe cancellation failed: ${err.message}` });
      }
    }
  }

  // ── 2. Delete all Firestore subcollections (usage, projects, etc.) ─────────
  await deleteSubcollections(userRef);

  // ── 3. Delete the user document ───────────────────────────────────────────
  await userRef.delete();

  // ── 4. Delete Firebase Auth account ───────────────────────────────────────
  try {
    await adminAuth.deleteUser(uid);
  } catch (err) {
    // auth/user-not-found is fine — already deleted
    if (err.code !== 'auth/user-not-found') {
      return res.status(500).json({ error: `Auth deletion failed: ${err.message}` });
    }
  }

  return res.status(200).json({ success: true });
}
