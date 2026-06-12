import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let unsubSnap = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Cancel any previous real-time listener
      if (unsubSnap) { unsubSnap(); unsubSnap = null; }

      setUser(fbUser);
      setUserData(null); // always clear stale data on auth change

      if (fbUser) {
        const ref = doc(db, 'users', fbUser.uid);

        // Force a direct server read — bypasses IndexedDB cache completely.
        // This guarantees the role field is up-to-date before any routing decision.
        try {
          const snap = await getDocFromServer(ref);
          if (snap.exists()) {
            setUserData(snap.data());
          } else {
            const newDoc = {
              email:                fbUser.email,
              displayName:          fbUser.displayName || '',
              photoURL:             fbUser.photoURL || null,
              plan:                 'free',
              role:                 null,
              stripeCustomerId:     null,
              stripeSubscriptionId: null,
              subscriptionStatus:   null,
              currentPeriodEnd:     null,
              cancelAtPeriodEnd:    false,
              usagePeriodStart:     null,
              createdAt:            serverTimestamp(),
            };
            await setDoc(ref, newDoc);
            setUserData({ ...newDoc, createdAt: null });
          }
        } catch (e) {
          console.error('[auth] user doc read failed:', e.code);
          // leave userData null — routes will wait or show login
        }

        setLoading(false);

        // Keep a real-time listener for plan / subscription changes after login.
        // Skip cache responses so a stale snapshot never overwrites fresh server data.
        unsubSnap = onSnapshot(
          ref,
          { includeMetadataChanges: true },
          (snap) => {
            if (!snap.metadata.fromCache && snap.exists()) {
              setUserData(snap.data());
            }
          },
          (err) => console.error('[auth] snapshot error:', err.code),
        );
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => { unsubAuth(); if (unsubSnap) unsubSnap(); };
  }, []);

  return (
    <AuthCtx.Provider value={{
      user,
      userData,
      loading,
      isAdmin: userData?.role === 'admin',
      signInWithEmail:  (e, p) => signInWithEmailAndPassword(auth, e, p),
      signUpWithEmail:  async (e, p, name) => {
        const cred = await createUserWithEmailAndPassword(auth, e, p);
        if (name?.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        return cred;
      },
      signInWithGoogle: ()     => signInWithPopup(auth, googleProvider),
      signOut:          ()     => fbSignOut(auth),
    }}>
      {!loading && children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
