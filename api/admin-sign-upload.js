import { createHash } from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { verifyAdmin } from './_verify-admin.js';

if (!getApps().length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  initializeApp({ credential: cert(JSON.parse(sa)) });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const uid = await verifyAdmin(req.headers.authorization);
  if (!uid) return res.status(403).json({ error: 'Admin access required' });

  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    return res.status(500).json({ error: 'Cloudinary credentials not configured' });
  }

  const { folder = 'litelayers/scenes' } = req.body ?? {};
  const timestamp = Math.round(Date.now() / 1000);

  // Sign: sorted params + secret  (per Cloudinary signed upload spec)
  const paramStr = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha1')
    .update(paramStr + apiSecret)
    .digest('hex');

  return res.status(200).json({ signature, timestamp, apiKey, cloudName, folder });
}
