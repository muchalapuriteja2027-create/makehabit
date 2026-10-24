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
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { UserProfile, HabitStack, CompletionRecord } from '../types.ts';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isGuest: boolean;
  loading: boolean;
  error: string | null;
  migrationSuccessMessage: string | null;
  migrationError: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  dismissMigrationNotice: () => void;
  updatePreferences: (updates: Partial<UserProfile>) => Promise<void>;
}

const GUEST_MODE_KEY = 'makehabit_guest_mode';
export const GUEST_HABITS_KEY = 'makehabit_guest_habits';
export const GUEST_COMPLETIONS_KEY = 'makehabit_guest_completions';
export const GUEST_PREFS_KEY = 'makehabit_guest_prefs';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem(GUEST_MODE_KEY) === 'true';
  });
  const [guestPrefs, setGuestPrefs] = useState<{ dailyTarget: number; soundEffects: boolean }>(() => {
    if (typeof window === 'undefined') return { dailyTarget: 3, soundEffects: true };
    try {
      const raw = localStorage.getItem(GUEST_PREFS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return { dailyTarget: 3, soundEffects: true };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationSuccessMessage, setMigrationSuccessMessage] = useState<string | null>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  // Safely migrate guest localStorage habits & completions to Firestore
  const migrateGuestData = async (userId: string) => {
    if (typeof window === 'undefined') return;
    const guestHabitsRaw = localStorage.getItem(GUEST_HABITS_KEY);
    const guestCompletionsRaw = localStorage.getItem(GUEST_COMPLETIONS_KEY);

    if (!guestHabitsRaw && !guestCompletionsRaw) {
      localStorage.removeItem(GUEST_MODE_KEY);
      setIsGuest(false);
      return;
    }

    try {
      const localHabits: HabitStack[] = guestHabitsRaw ? JSON.parse(guestHabitsRaw) : [];
      const localCompletions: Record<string, CompletionRecord> = guestCompletionsRaw
        ? JSON.parse(guestCompletionsRaw)
        : {};

      if (localHabits.length === 0 && Object.keys(localCompletions).length === 0) {
        localStorage.removeItem(GUEST_HABITS_KEY);
        localStorage.removeItem(GUEST_COMPLETIONS_KEY);
        localStorage.removeItem(GUEST_MODE_KEY);
        setIsGuest(false);
        return;
      }

      // 1. Fetch existing cloud habits to prevent duplicates
      const cloudHabitsSnap = await getDocs(collection(db, 'users', userId, 'habits'));
      const cloudHabitFingerprints = new Map<string, string>(); // anchor__action lowercase -> doc.id
      cloudHabitsSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const fp = `${(d.anchor || '').trim()}__${(d.action || '').trim()}`.toLowerCase();
        cloudHabitFingerprints.set(fp, docSnap.id);
      });

      const habitIdMap: Record<string, string> = {};

      // 2. Migrate each local habit if not already present
      for (const localHabit of localHabits) {
        const fp = `${(localHabit.anchor || '').trim()}__${(localHabit.action || '').trim()}`.toLowerCase();
        const existingCloudId = cloudHabitFingerprints.get(fp);

        if (existingCloudId) {
          habitIdMap[localHabit.id] = existingCloudId;
        } else {
          const targetHabitId =
            localHabit.id && localHabit.id.startsWith('habit_')
              ? localHabit.id
              : `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

          const habitDocRef = doc(db, 'users', userId, 'habits', targetHabitId);
          await setDoc(habitDocRef, {
            ...localHabit,
            id: targetHabitId,
            userId,
            daysOfWeek: Array.isArray(localHabit.daysOfWeek)
              ? localHabit.daysOfWeek.join(',')
              : localHabit.daysOfWeek || '0,1,2,3,4,5,6',
            createdAt: localHabit.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          cloudHabitFingerprints.set(fp, targetHabitId);
          habitIdMap[localHabit.id] = targetHabitId;
        }
      }

      // 3. Fetch existing cloud completions to prevent duplicates
      const cloudCompletionsSnap = await getDocs(collection(db, 'users', userId, 'completions'));
      const existingCompletionIds = new Set<string>();
      cloudCompletionsSnap.forEach((docSnap) => {
        existingCompletionIds.add(docSnap.id);
      });

      // 4. Migrate each completion record
      for (const compKey of Object.keys(localCompletions)) {
        const comp = localCompletions[compKey];
        if (!comp || !comp.completed) continue;

        const targetHabitId = habitIdMap[comp.habitId] || comp.habitId;
        const targetCompletionId = `${comp.date}_${targetHabitId}`;

        if (!existingCompletionIds.has(targetCompletionId)) {
          const compDocRef = doc(db, 'users', userId, 'completions', targetCompletionId);
          await setDoc(compDocRef, {
            id: targetCompletionId,
            userId,
            habitId: targetHabitId,
            date: comp.date,
            completed: true,
            completedAt: comp.completedAt || new Date().toISOString(),
          });
          existingCompletionIds.add(targetCompletionId);
        }
      }

      // 5. Verification step: only clear localStorage after all writes succeed
      localStorage.removeItem(GUEST_HABITS_KEY);
      localStorage.removeItem(GUEST_COMPLETIONS_KEY);
      localStorage.removeItem(GUEST_MODE_KEY);
      setIsGuest(false);
      setMigrationSuccessMessage(
        'Your guest habits and completion history have been safely synced to your Google account! 🎉'
      );
    } catch (err: unknown) {
      console.error('Guest migration failed:', err);
      // DO NOT clear localStorage — preserve guest data so user never loses work!
      setMigrationError(
        'Could not sync all guest habits to the cloud. Your local data has been preserved on this device. Please try again.'
      );
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsGuest(false);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userDocRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }

          const now = new Date().toISOString();

          if (userSnap && userSnap.exists()) {
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
              plan: 'free',
            };

            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
            }

            setUserProfile(newProfile);
          }

          // Trigger safe migration of any guest data
          await migrateGuestData(user.uid);
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

  const enterGuestMode = () => {
    localStorage.setItem(GUEST_MODE_KEY, 'true');
    setIsGuest(true);
    setError(null);
  };

  const exitGuestMode = () => {
    localStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);
  };

  const dismissMigrationNotice = () => {
    setMigrationSuccessMessage(null);
    setMigrationError(null);
  };

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
      if (currentUser) {
        await logOut();
      }
      setUserProfile(null);
      setIsGuest(false);
      localStorage.removeItem(GUEST_MODE_KEY);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      throw err;
    }
  };

  const updatePreferences = async (updates: Partial<UserProfile>) => {
    if (isGuest) {
      setGuestPrefs((prev) => {
        const next = {
          dailyTarget: updates.dailyTarget !== undefined ? updates.dailyTarget : prev.dailyTarget,
          soundEffects: updates.soundEffects !== undefined ? updates.soundEffects : prev.soundEffects,
        };
        try {
          localStorage.setItem(GUEST_PREFS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      return;
    }
    if (!currentUser || !userProfile) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updates);
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  // Provide synthetic profile for guest mode
  const effectiveProfile: UserProfile | null = currentUser
    ? userProfile
    : isGuest
    ? {
        userId: 'guest',
        displayName: 'Guest Builder',
        email: 'Local device storage only (not synced)',
        photoURL: '',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        dailyTarget: guestPrefs.dailyTarget,
        soundEffects: guestPrefs.soundEffects,
        plan: 'free',
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile: effectiveProfile,
        isGuest,
        loading,
        error,
        migrationSuccessMessage,
        migrationError,
        signIn,
        signOutUser,
        enterGuestMode,
        exitGuestMode,
        dismissMigrationNotice,
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
