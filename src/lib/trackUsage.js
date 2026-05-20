/**
 * Track feature usage and enforce plan limits.
 *
 * Call this BEFORE executing the operation. If `allowed` is false the user
 * has hit their plan limit — show an upgrade prompt instead of running the op.
 *
 * @param {string} userId  - Firebase UID
 * @param {string} feature - 'bgRemovals' | 'sceneGenerations' | 'resizes' | 'exports'
 * @param {number} amount  - Units to consume (default 1)
 * @returns {Promise<{ allowed: boolean, used: number, limit: number, remaining: number }>}
 *
 * Usage example:
 *   import { trackUsage } from '../lib/trackUsage';
 *
 *   const result = await trackUsage(user.uid, 'bgRemovals');
 *   if (!result.allowed) {
 *     alert(`Limit reached (${result.used}/${result.limit}). Upgrade to continue.`);
 *     return;
 *   }
 *   // ... proceed with background removal
 */
export async function trackUsage(userId, feature, amount = 1) {
  const res = await fetch('/api/track-usage', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ userId, feature, amount }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Usage tracking failed (${res.status})`);
  }

  return res.json();
}
