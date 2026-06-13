/**
 * Track feature usage and enforce plan limits.
 *
 * Call this BEFORE executing the operation. If `allowed` is false the user
 * has hit their plan limit — show an upgrade prompt instead of running the op.
 *
 * @param {import('firebase/auth').User} firebaseUser - Firebase auth user object
 * @param {string} feature - 'bgRemovals' | 'sceneGenerations' | 'resizes' | 'exports'
 * @param {number} amount  - Units to consume (default 1)
 * @returns {Promise<{ allowed: boolean, used: number, limit: number, remaining: number }>}
 */
export async function trackUsage(firebaseUser, feature, amount = 1) {
  const token = await firebaseUser.getIdToken();
  const res = await fetch('/api/track-usage', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ feature, amount }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Usage tracking failed (${res.status})`);
  }

  return res.json();
}
