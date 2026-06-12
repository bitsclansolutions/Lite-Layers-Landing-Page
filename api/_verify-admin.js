import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function init() {
  if (!getApps().length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
    initializeApp({ credential: cert(JSON.parse(sa)) });
  }
  return { db: getFirestore(), adminAuth: getAuth() };
}

/** Verifies the Bearer token and checks role === 'admin' in Firestore.
 *  Returns the decoded uid string on success, null otherwise. */
export async function verifyAdmin(authHeader) {
  const { db, adminAuth } = init();
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const snap = await db.collection('users').doc(decoded.uid).get();
    if (!snap.exists || snap.data().role !== 'admin') return null;
    return decoded.uid;
  } catch {
    return null;
  }
}
