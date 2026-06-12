import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyAdmin } from './_verify-admin.js';

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}
const db = getFirestore();

function periodKey(userData) {
  if (userData.usagePeriodStart) return userData.usagePeriodStart;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const uid = await verifyAdmin(req.headers.authorization);
  if (!uid) return res.status(403).json({ error: 'Admin access required' });

  const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(500).get();

  const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Fetch current-period usage for each user in parallel
  const usageSnaps = await Promise.all(
    users.map(u => {
      const key = periodKey(u);
      return db.collection('users').doc(u.id).collection('usage').doc(key).get();
    })
  );

  const result = users.map((u, i) => {
    const usageData = usageSnaps[i].exists ? usageSnaps[i].data() : {};
    return {
      id:                  u.id,
      email:               u.email ?? '',
      displayName:         u.displayName ?? '',
      photoURL:            u.photoURL ?? null,
      plan:                u.plan ?? 'free',
      role:                u.role ?? null,
      subscriptionStatus:  u.subscriptionStatus ?? null,
      cancelAtPeriodEnd:   u.cancelAtPeriodEnd ?? false,
      currentPeriodEnd:    u.currentPeriodEnd?.seconds ?? null,
      stripeCustomerId:    u.stripeCustomerId ?? null,
      stripeSubscriptionId: u.stripeSubscriptionId ?? null,
      createdAt:           u.createdAt?.seconds ?? null,
      usage: {
        bgRemovals:       usageData.bgRemovals       ?? 0,
        sceneGenerations: usageData.sceneGenerations ?? 0,
        resizes:          usageData.resizes          ?? 0,
        exports:          usageData.exports          ?? 0,
      },
    };
  });

  return res.status(200).json({ users: result });
}
