import { createHash } from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyAdmin } from './_verify-admin.js';

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const uid = await verifyAdmin(req.headers.authorization);
  if (!uid) return res.status(403).json({ error: 'Admin access required' });

  const { sceneId, publicId } = req.body ?? {};
  if (!sceneId) return res.status(400).json({ error: 'sceneId required' });

  // Delete from Cloudinary if publicId is known
  if (publicId) {
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;

    if (apiKey && apiSecret && cloudName) {
      const timestamp = Math.round(Date.now() / 1000);
      const paramStr  = `public_id=${publicId}&timestamp=${timestamp}`;
      const signature = createHash('sha1').update(paramStr + apiSecret).digest('hex');

      const form = new URLSearchParams({ public_id: publicId, api_key: apiKey, timestamp, signature });
      try {
        await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
          { method: 'POST', body: form, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
      } catch {
        // Non-fatal: log and continue to Firestore delete
      }
    }
  }

  // Delete from Firestore
  await db.collection('preset_scenes').doc(sceneId).delete();

  return res.status(200).json({ success: true });
}
