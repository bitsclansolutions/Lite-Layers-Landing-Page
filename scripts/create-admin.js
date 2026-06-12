/**
 * One-time script — creates the Firestore user document for the admin account.
 * Run from the project root:  node scripts/create-admin.js
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ADMIN_UID  = 'EbhwFZcZ09MrpK11EzMRMQZXzFI2';

/* ── load .env.local ─────────────────────────────────────────── */
function loadEnv() {
  const path = resolve(__dirname, '../.env.local');
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    console.error('❌  Could not read .env.local — make sure you run this from the project root.');
    process.exit(1);
  }

  const vars = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    // Split only on the first '=' so JSON values with '=' inside are preserved
    vars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return vars;
}

/* ── main ────────────────────────────────────────────────────── */
async function main() {
  const env = loadEnv();

  if (!env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('❌  FIREBASE_SERVICE_ACCOUNT not found in .env.local');
    process.exit(1);
  }

  let sa;
  try {
    sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  } catch {
    console.error('❌  FIREBASE_SERVICE_ACCOUNT is not valid JSON');
    process.exit(1);
  }

  initializeApp({ credential: cert(sa) });
  const db        = getFirestore();
  const adminAuth = getAuth();

  /* 1. Fetch the Auth user to get email / displayName */
  let authUser;
  try {
    authUser = await adminAuth.getUser(ADMIN_UID);
    console.log(`✔  Found Firebase Auth user: ${authUser.email}`);
  } catch (e) {
    console.error(`❌  Could not find UID "${ADMIN_UID}" in Firebase Auth: ${e.message}`);
    console.error('    Make sure the user was created in Firebase Authentication first.');
    process.exit(1);
  }

  /* 2. Build the Firestore document */
  const adminDoc = {
    email:               authUser.email         || '',
    displayName:         authUser.displayName   || 'Admin',
    photoURL:            authUser.photoURL       || null,
    plan:                'business',   // admin has full access
    role:                'admin',
    stripeCustomerId:    null,
    stripeSubscriptionId:null,
    subscriptionStatus:  null,
    currentPeriodEnd:    null,
    cancelAtPeriodEnd:   false,
    usagePeriodStart:    null,
  };

  /* 3. Write to Firestore — merge so existing Stripe fields aren't lost */
  const userRef  = db.collection('users').doc(ADMIN_UID);
  const existing = await userRef.get();

  if (existing.exists) {
    await userRef.update(adminDoc);
    console.log('✔  Updated existing document with role: admin');
  } else {
    await userRef.set({ ...adminDoc, createdAt: Timestamp.now() });
    console.log('✔  Created new admin user document');
  }

  console.log('\n✅  Admin setup complete');
  console.log(`   UID:   ${ADMIN_UID}`);
  console.log(`   Email: ${authUser.email}`);
  console.log(`   Role:  admin`);
  console.log(`   Plan:  business`);
  console.log('\n   Sign in and visit /admin to access the dashboard.\n');

  process.exit(0);
}

main().catch(e => {
  console.error('❌  Unexpected error:', e.message);
  process.exit(1);
});
