import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { verifyAdmin } from './_verify-admin.js';

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}
const db = getFirestore();

const VALID_PLANS = ['free', 'pro', 'business'];

function periodKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const adminUid = await verifyAdmin(req.headers.authorization);
  if (!adminUid) return res.status(403).json({ error: 'Admin access required' });

  const { userId, action, plan } = req.body ?? {};
  if (!userId || !action) return res.status(400).json({ error: 'userId and action required' });

  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });

  switch (action) {
    case 'changePlan': {
      if (!VALID_PLANS.includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan. Must be free, pro, or business' });
      }
      await userRef.update({ plan });
      return res.status(200).json({ success: true });
    }

    case 'resetUsage': {
      const userData = userSnap.data();
      const key = userData.usagePeriodStart || periodKey();
      const usageRef = userRef.collection('usage').doc(key);
      await usageRef.set({
        bgRemovals: 0, sceneGenerations: 0, resizes: 0, exports: 0,
      });
      return res.status(200).json({ success: true });
    }

    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}
