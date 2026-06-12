import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { verifyAdmin } from './_verify-admin.js';

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const uid = await verifyAdmin(req.headers.authorization);
  if (!uid) return res.status(403).json({ error: 'Admin access required' });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalSnap, freeSnap, proSnap, bizSnap,
    activeSnap, trialingSnap, pastDueSnap, newUsersSnap
  ] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('users').where('plan', '==', 'free').count().get(),
    db.collection('users').where('plan', '==', 'pro').count().get(),
    db.collection('users').where('plan', '==', 'business').count().get(),
    db.collection('users').where('subscriptionStatus', '==', 'active').count().get(),
    db.collection('users').where('subscriptionStatus', '==', 'trialing').count().get(),
    db.collection('users').where('subscriptionStatus', '==', 'past_due').count().get(),
    db.collection('users')
      .where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
      .count().get(),
  ]);

  return res.status(200).json({
    totalUsers:           totalSnap.data().count,
    freeUsers:            freeSnap.data().count,
    proUsers:             proSnap.data().count,
    businessUsers:        bizSnap.data().count,
    activeSubscriptions:  activeSnap.data().count,
    trialingSubscriptions: trialingSnap.data().count,
    pastDueSubscriptions: pastDueSnap.data().count,
    newSignupsLast30Days: newUsersSnap.data().count,
  });
}
