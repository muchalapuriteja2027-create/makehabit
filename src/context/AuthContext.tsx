import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  signInWithGoogle,
  logOut,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType,
  FirebaseUser,
} from '../firebase.ts';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types.ts';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updatePreferences: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userDocRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }

          const now = new Date().toISOString();

          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            const updatedProfile: UserProfile = {
              ...data,
              lastLoginAt: now,
              displayName: user.displayName || data.displayName || 'Habit Builder',
              photoURL: user.photoURL || data.photoURL,
            };
            setUserProfile(updatedProfile);

            // Update lastLoginAt
            try {
              await updateDoc(userDocRef, {
                lastLoginAt: now,
                displayName: updatedProfile.displayName,
                photoURL: updatedProfile.photoURL || '',
              });
            } catch (err) {
              console.warn('Could not update last login timestamp:', err);
            }
          } else {
            // Create clean user profile
            const newProfile: UserProfile = {
              userId: user.uid,
              displayName: user.displayName || 'Habit Builder',
              email: user.email || '',
              photoURL: user.photoURL || '',
              createdAt: now,
              lastLoginAt: now,
              dailyTarget: 3,
              soundEffects: true,
            };

            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
            }

            setUserProfile(newProfile);
          }
        } catch (err: unknown) {
          console.error('Error fetching/creating user profile:', err);
          setError(err instanceof Error ? err.message : 'Error setting up user profile');
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      throw err;
    }
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await logOut();
      setUserProfile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      throw err;
    }
  };

  const updatePreferences = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updates);
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        signIn,
        signOutUser,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
