import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase.ts';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from './AuthContext.tsx';
import {
  HabitStack,
  CompletionRecord,
  StreakStats,
  DayStreakStatus,
  CelebrationData,
} from '../types.ts';
import confetti from 'canvas-confetti';

interface HabitsContextType {
  habits: HabitStack[];
  completions: Record<string, CompletionRecord>;
  loading: boolean;
  streakStats: StreakStats;
  celebrationData: CelebrationData | null;
  closeCelebration: () => void;
  triggerCelebrationModal: (habit?: HabitStack, type?: CelebrationData['type']) => void;
  triggerMilestoneCelebration: (milestoneKey: 'streak_3' | 'streak_7' | 'streak_14') => void;
  addHabit: (data: Omit<HabitStack, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<string>;
  updateHabit: (id: string, data: Partial<HabitStack>) => Promise<void>;
  togglePauseHabit: (id: string, pausedReason?: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, dateStr?: string) => Promise<boolean>;
  isHabitCompletedOnDate: (habitId: string, dateStr?: string) => boolean;
  todayDateStr: string;
  todayHabits: HabitStack[];
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const HabitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, updatePreferences } = useAuth();
  const [habits, setHabits] = useState<HabitStack[]>([]);
  const [completions, setCompletions] = useState<Record<string, CompletionRecord>>({});
  const [loading, setLoading] = useState(true);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  const todayDateStr = useMemo(() => getTodayDateStr(), []);

  // Listen to habits
  useEffect(() => {
    if (!currentUser) {
      setHabits([]);
      setCompletions({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const habitsPath = `users/${currentUser.uid}/habits`;
    const habitsCol = collection(db, 'users', currentUser.uid, 'habits');

    const unsubscribeHabits = onSnapshot(
      habitsCol,
      (snapshot) => {
        const loaded: HabitStack[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let daysArr: number[] = [0, 1, 2, 3, 4, 5, 6];
          if (Array.isArray(data.daysOfWeek)) {
            daysArr = data.daysOfWeek;
          } else if (typeof data.daysOfWeek === 'string') {
            daysArr = data.daysOfWeek.split(',').map((n: string) => parseInt(n.trim(), 10)).filter((n: number) => !isNaN(n));
          }
          loaded.push({
            id: docSnap.id,
            userId: data.userId || currentUser.uid,
            title: data.title || 'Habit Stack',
            anchor: data.anchor || '',
            action: data.action || '',
            category: data.category || 'Productivity',
            frequency: data.frequency || 'daily',
            daysOfWeek: daysArr,
            durationMinutes: data.durationMinutes || 15,
            scheduledTime: data.scheduledTime || '08:00 AM',
            status: data.status || 'active',
            pausedReason: data.pausedReason || '',
            order: data.order ?? 1,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        });
        loaded.sort((a, b) => a.order - b.order);
        setHabits(loaded);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, habitsPath);
      }
    );

    const completionsPath = `users/${currentUser.uid}/completions`;
    const completionsCol = collection(db, 'users', currentUser.uid, 'completions');

    const unsubscribeCompletions = onSnapshot(
      completionsCol,
      (snapshot) => {
        const loadedMap: Record<string, CompletionRecord> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedMap[docSnap.id] = {
            id: docSnap.id,
            userId: data.userId || currentUser.uid,
            habitId: data.habitId || '',
            date: data.date || '',
            completed: Boolean(data.completed),
            completedAt: data.completedAt || new Date().toISOString(),
          };
        });
        setCompletions(loadedMap);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, completionsPath);
      }
    );

    return () => {
      unsubscribeHabits();
      unsubscribeCompletions();
    };
  }, [currentUser]);

  // Today's applicable active habits based on day of week
  const todayHabits = useMemo(() => {
    const todayDayOfWeek = new Date().getDay(); // 0 = Sun, 1 = Mon ...
    return habits.filter((h) => {
      if (h.status !== 'active') return false;
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'weekdays') return todayDayOfWeek >= 1 && todayDayOfWeek <= 5;
      return h.daysOfWeek.includes(todayDayOfWeek);
    });
  }, [habits]);

  const isHabitCompletedOnDate = (habitId: string, dateStr: string = todayDateStr): boolean => {
    const key = `${dateStr}_${habitId}`;
    return Boolean(completions[key]?.completed);
  };

  // Streak & Statistics calculation
  const streakStats = useMemo<StreakStats>(() => {
    const days: DayStreakStatus[] = [];
    const today = new Date();

    // Generate past 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const isoDate = formatDateToIso(d);
      const dayOfWeek = d.getDay();

      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayShorts = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Habits due on that day
      const dueHabits = habits.filter((h) => {
        if (h.frequency === 'daily') return true;
        if (h.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
        return h.daysOfWeek.includes(dayOfWeek);
      });

      const totalHabitsDue = dueHabits.length;
      let completedCount = 0;
      dueHabits.forEach((h) => {
        const key = `${isoDate}_${h.id}`;
        if (completions[key]?.completed) {
          completedCount++;
        }
      });

      days.push({
        date: isoDate,
        dayLabel: dayLabels[dayOfWeek],
        dayShort: dayShorts[dayOfWeek],
        displayDate: `${monthNames[d.getMonth()]} ${d.getDate()}`,
        totalHabitsDue,
        completedCount,
        isAllCompleted: totalHabitsDue > 0 && completedCount >= totalHabitsDue,
        isToday: i === 0,
      });
    }

    // Calculate unbroken current streak
    let currentStreak = 0;
    const checkDate = new Date();
    // If today is complete, count today, otherwise if today in progress, check starting yesterday or today
    const todayStatus = days[days.length - 1];
    let startOffset = 0;
    if (todayStatus.isAllCompleted) {
      startOffset = 0;
    } else {
      // Check if yesterday was completed
      startOffset = 1;
    }

    for (let i = startOffset; i < 90; i++) {
      const d = new Date();
      d.setDate(checkDate.getDate() - i);
      const isoDate = formatDateToIso(d);
      const dow = d.getDay();

      const due = habits.filter((h) => {
        if (h.frequency === 'daily') return true;
        if (h.frequency === 'weekdays') return dow >= 1 && dow <= 5;
        return h.daysOfWeek.includes(dow);
      });

      if (due.length === 0) {
        // No habits scheduled on this day, streak continues without penalty
        continue;
      }

      let allDone = true;
      for (const h of due) {
        const key = `${isoDate}_${h.id}`;
        if (!completions[key]?.completed) {
          allDone = false;
          break;
        }
      }

      if (allDone) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Real streak calculation
    const calculatedStreak = currentStreak > 0 ? currentStreak : todayStatus.completedCount > 0 ? 1 : 0;
    const totalCompletions = Object.values(completions).filter((c) => c.completed).length;

    // Real longest streak across history
    let maxHistoricalStreak = calculatedStreak;
    let runningStreak = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(checkDate.getDate() - i);
      const isoDate = formatDateToIso(d);
      const dow = d.getDay();

      const due = habits.filter((h) => {
        if (h.frequency === 'daily') return true;
        if (h.frequency === 'weekdays') return dow >= 1 && dow <= 5;
        return h.daysOfWeek.includes(dow);
      });

      if (due.length === 0) continue;

      let allDone = true;
      for (const h of due) {
        const key = `${isoDate}_${h.id}`;
        if (!completions[key]?.completed) {
          allDone = false;
          break;
        }
      }

      if (allDone) {
        runningStreak++;
        if (runningStreak > maxHistoricalStreak) {
          maxHistoricalStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }

    // Weekly adherence based strictly on actual data
    let totalDuePastWeek = 0;
    let totalDonePastWeek = 0;
    days.forEach((d) => {
      totalDuePastWeek += d.totalHabitsDue;
      totalDonePastWeek += d.completedCount;
    });

    const weeklyAdherencePercent =
      totalDuePastWeek > 0 ? Math.round((totalDonePastWeek / totalDuePastWeek) * 100) : 0;

    return {
      currentStreak: calculatedStreak,
      longestStreak: maxHistoricalStreak,
      totalCompletionsCount: totalCompletions,
      weeklyAdherencePercent,
      past7Days: days,
    };
  }, [habits, completions]);

  // Audio tone helper
  const playHapticAudio = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // AudioContext may be restricted by browser policy before user gesture
    }
  };

  const triggerCelebrationModal = (habit?: HabitStack, type: CelebrationData['type'] = 'habit') => {
    const streak = streakStats.currentStreak;
    let milestoneTitle: string | undefined;
    let milestoneBadge: string | undefined;
    let milestoneMessage: string | undefined;

    if (type === 'milestone_3') {
      milestoneTitle = '3-Day Spark Milestone!';
      milestoneBadge = '🔥';
      milestoneMessage = "3 consecutive days! You're officially building momentum.";
    } else if (type === 'milestone_7') {
      milestoneTitle = '7-Day Momentum Milestone!';
      milestoneBadge = '⚡';
      milestoneMessage = 'A full week of unbroken consistency! Your habit loop is taking root.';
    } else if (type === 'milestone_14') {
      milestoneTitle = '14-Day Master Milestone!';
      milestoneBadge = '🏆';
      milestoneMessage = "Two unbroken weeks! You've formed a genuine daily rhythm.";
    } else if (type === 'all_done') {
      milestoneTitle = 'Daily Routines Complete!';
      milestoneBadge = '🌟';
      milestoneMessage = 'Great job! You showed up and executed your habits today!';
    }

    setCelebrationData({
      type,
      habitTitle: habit?.title,
      anchor: habit?.anchor,
      action: habit?.action,
      streak,
      milestoneTitle,
      milestoneBadge,
      milestoneMessage,
    });

    // Kinetic Confetti
    try {
      confetti({
        particleCount: type.startsWith('milestone') ? 85 : 55,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#10b981', '#8455ef', '#f59e0b', '#3b82f6'],
        disableForReducedMotion: true,
      });
    } catch {
      // Confetti fallback
    }
  };

  const triggerMilestoneCelebration = (milestoneKey: 'streak_3' | 'streak_7' | 'streak_14') => {
    triggerCelebrationModal(undefined, milestoneKey as CelebrationData['type']);
  };

  const closeCelebration = () => {
    setCelebrationData(null);
  };

  // Add Habit
  const addHabit = async (
    data: Omit<HabitStack, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'order'>
  ): Promise<string> => {
    if (!currentUser) throw new Error('Must be signed in to create habits');
    const habitId = `habit_${Date.now()}`;
    const newHabit: HabitStack = {
      ...data,
      id: habitId,
      userId: currentUser.uid,
      order: habits.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, 'users', currentUser.uid, 'habits', habitId);
    try {
      await setDoc(docRef, {
        ...newHabit,
        daysOfWeek: newHabit.daysOfWeek.join(','),
      });
      return habitId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/habits/${habitId}`);
    }
  };

  // Update Habit
  const updateHabit = async (id: string, updates: Partial<HabitStack>) => {
    if (!currentUser) return;
    const docRef = doc(db, 'users', currentUser.uid, 'habits', id);
    try {
      const payload: Record<string, unknown> = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      if (Array.isArray(updates.daysOfWeek)) {
        payload.daysOfWeek = updates.daysOfWeek.join(',');
      }
      await updateDoc(docRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/habits/${id}`);
    }
  };

  // Toggle Pause
  const togglePauseHabit = async (id: string, pausedReason?: string) => {
    const target = habits.find((h) => h.id === id);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'paused' : 'active';
    await updateHabit(id, {
      status: newStatus,
      pausedReason: newStatus === 'paused' ? pausedReason || 'Paused by user' : '',
    });
  };

  // Delete Habit
  const deleteHabit = async (id: string) => {
    if (!currentUser) return;
    const docRef = doc(db, 'users', currentUser.uid, 'habits', id);
    try {
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/habits/${id}`);
    }
  };

  // Toggle Completion
  const toggleCompletion = async (habitId: string, dateStr: string = todayDateStr): Promise<boolean> => {
    if (!currentUser) return false;
    const completionId = `${dateStr}_${habitId}`;
    const currentlyDone = isHabitCompletedOnDate(habitId, dateStr);
    const newDoneState = !currentlyDone;

    const docRef = doc(db, 'users', currentUser.uid, 'completions', completionId);

    try {
      if (newDoneState) {
        await setDoc(docRef, {
          id: completionId,
          userId: currentUser.uid,
          habitId,
          date: dateStr,
          completed: true,
          completedAt: new Date().toISOString(),
        });

        // Trigger effects
        if (userProfile?.soundEffects !== false) {
          playHapticAudio();
        }

        // Lightweight subtle confetti burst on every completed habit
        try {
          confetti({
            particleCount: 35,
            spread: 55,
            origin: { y: 0.7 },
            colors: ['#10b981', '#8455ef', '#f59e0b', '#3b82f6'],
            disableForReducedMotion: true,
          });
        } catch {
          // confetti fallback
        }

        const habit = habits.find((h) => h.id === habitId);
        // Only trigger celebration modal if all habits due today are completed
        const otherIncompleteHabits = todayHabits.filter(
          (h) => h.id !== habitId && !isHabitCompletedOnDate(h.id, dateStr)
        );
        const isAllDone = otherIncompleteHabits.length === 0 && todayHabits.length > 0;
        if (habit && isAllDone) {
          const currentDayStreak = streakStats.currentStreak;
          if (currentDayStreak === 14) {
            triggerCelebrationModal(habit, 'milestone_14');
          } else if (currentDayStreak === 7) {
            triggerCelebrationModal(habit, 'milestone_7');
          } else if (currentDayStreak === 3) {
            triggerCelebrationModal(habit, 'milestone_3');
          } else {
            triggerCelebrationModal(habit, 'all_done');
          }
        }
      } else {
        await setDoc(docRef, {
          id: completionId,
          userId: currentUser.uid,
          habitId,
          date: dateStr,
          completed: false,
          completedAt: new Date().toISOString(),
        });
      }
      return newDoneState;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/completions/${completionId}`);
    }
  };

  return (
    <HabitsContext.Provider
      value={{
        habits,
        completions,
        loading,
        streakStats,
        celebrationData,
        closeCelebration,
        triggerCelebrationModal,
        triggerMilestoneCelebration,
        addHabit,
        updateHabit,
        togglePauseHabit,
        deleteHabit,
        toggleCompletion,
        isHabitCompletedOnDate,
        todayDateStr,
        todayHabits,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
};
