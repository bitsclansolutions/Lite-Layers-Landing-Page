import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { verifyToken } from './_verify-token.js';

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}

const db = getFirestore();

const LIMITS = {
  free:     { bgRemovals: 10,  sceneGenerations: 5,  resizes: 50,  exports: 20 },
  pro:      { bgRemovals: 50,  sceneGenerations: 30, resizes: -1,  exports: -1 },
  business: { bgRemovals: -1,  sceneGenerations: -1, resizes: -1,  exports: -1 },
};

const VALID_FEATURES = ['bgRemovals', 'sceneGenerations', 'resizes', 'exports'];

// Paid users: use Stripe billing period start date (YYYY-MM-DD).
// Free users: use first day of the current calendar month.
function periodKey(userData) {
  if (userData.usagePeriodStart) return userData.usagePeriodStart;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const uid = await verifyToken(req.headers.authorization);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });

  const { feature, amount = 1 } = req.body ?? {};
  const userId = uid;

  if (!feature) {
    return res.status(400).json({ error: 'feature is required' });
  }
  if (!VALID_FEATURES.includes(feature)) {
    return res.status(400).json({ error: `Invalid feature. Must be one of: ${VALID_FEATURES.join(', ')}` });
  }
  if (!Number.isInteger(amount) || amount < 1) {
    return res.status(400).json({ error: 'amount must be a positive integer' });
  }

  const userSnap = await db.collection('users').doc(userId).get();
  if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });

  const userData = userSnap.data();
  const plan     = userData.plan || 'free';
  const limits   = LIMITS[plan] || LIMITS.free;
  const limit    = limits[feature];

  const key      = periodKey(userData);
  const usageRef = db.collection('users').doc(userId).collection('usage').doc(key);
  const usageSnap = await usageRef.get();
  const currentUsage = usageSnap.exists ? (usageSnap.data()[feature] ?? 0) : 0;

  if (limit !== -1 && currentUsage + amount > limit) {
    return res.status(200).json({
      allowed:   false,
      used:      currentUsage,
      limit,
      remaining: Math.max(0, limit - currentUsage),
    });
  }

  await usageRef.set({ [feature]: FieldValue.increment(amount) }, { merge: true });

  return res.status(200).json({
    allowed:   true,
    used:      currentUsage + amount,
    limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - currentUsage - amount),
  });
}
