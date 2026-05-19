import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let unsubSnap = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = null; }
      setUser(fbUser);

      if (fbUser) {
        const ref = doc(db, 'users', fbUser.uid);
        unsubSnap = onSnapshot(ref, async (snap) => {
          if (snap.exists()) {
            setUserData(snap.data());
          } else {
            const newDoc = {
              email: fbUser.email,
              displayName: fbUser.displayName || '',
              photoURL: fbUser.photoURL || null,
              plan: 'free',
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              subscriptionStatus: null,
              currentPeriodEnd: null,
              createdAt: serverTimestamp(),
            };
            await setDoc(ref, newDoc);
          }
          setLoading(false);
        });
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
