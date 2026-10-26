import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useHabits } from '../context/HabitsContext.tsx';
import { STUDY_CHALLENGE_TEMPLATES, HabitStack } from '../types.ts';
import { CategoryBadge } from './CategoryBadge.tsx';

interface StudyChallengeCardProps {
  onOpenNewStack: () => void;
}

export const StudyChallengeCard: React.FC<StudyChallengeCardProps> = ({ onOpenNewStack: _onOpenNewStack }) => {
  const { userProfile, updatePreferences, isGuest, currentUser } = useAuth();
  const { habits, completions, addHabit, updateHabit, todayDateStr, isHabitCompletedOnDate, toggleCompletion } = useHabits();

  const [isStarting, setIsStarting] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const studyChallenge = userProfile?.studyChallenge;
  const isChallengeActive = Boolean(studyChallenge?.isActive);

  // Find all study-related habits (matching category 'Work', title, or anchor/action)
  const studyHabits = habits.filter((h) => {
    const titleLower = (h.title || '').toLowerCase();
    const actionLower = (h.action || '').toLowerCase();
    const anchorLower = (h.anchor || '').toLowerCase();
    return (
      titleLower.includes('study') ||
      titleLower.includes('lecture') ||
      titleLower.includes('pomodoro') ||
      titleLower.includes('recall') ||
      actionLower.includes('study') ||
      actionLower.includes('lecture') ||
      actionLower.includes('exam') ||
      anchorLower.includes('laptop') ||
      (studyChallenge?.habitIds && studyChallenge.habitIds.includes(h.id))
    );
  });

  // Calculate actual challenge progress from real completion records
  const startedAtDateStr = studyChallenge?.startedAt
    ? studyChallenge.startedAt.split('T')[0]
    : todayDateStr;

  // Set of dates where at least one study habit was completed since challenge started
  const completedStudyDates = new Set<string>();
  Object.values(completions).forEach((comp) => {
    if (comp.completed && comp.date >= startedAtDateStr) {
      const isRelated = studyHabits.some((sh) => sh.id === comp.habitId && sh.status === 'active');
      if (isRelated) {
        completedStudyDates.add(comp.date);
      }
    }
  });

  const completedDaysCount = Math.min(21, completedStudyDates.size);
  const activeStudyHabits = studyHabits.filter((habit) => habit.status === 'active');
  const pausedStudyHabitsCount = studyHabits.length - activeStudyHabits.length;
  const isTodayStudyCompleted = activeStudyHabits.some((sh) => isHabitCompletedOnDate(sh.id, todayDateStr));
  const progressPercent = Math.min(100, Math.round((completedDaysCount / 21) * 100));

  // Current day count since start
  const startedTime = studyChallenge?.startedAt ? new Date(studyChallenge.startedAt).getTime() : Date.now();
  const daysSinceStart = Math.min(21, Math.max(1, Math.floor((Date.now() - startedTime) / (1000 * 60 * 60 * 24)) + 1));

  // Start the 21-Day Challenge
  const handleStartChallenge = async () => {
    setIsStarting(true);
    setActiveFeedback(null);
    try {
      const addedHabitIds: string[] = [];

      // Check if primary study template already exists to prevent duplicate habits
      const primaryTemplate = STUDY_CHALLENGE_TEMPLATES[0];
      const matchesPrimaryStudyHabit = (h: HabitStack) =>
        h.title.toLowerCase().includes('pomodoro') ||
        h.title.toLowerCase().includes('study') ||
        (h.anchor.toLowerCase().includes('laptop') && h.action.toLowerCase().includes('study'));
      const existingMatch = habits.find((h) => h.status === 'active' && matchesPrimaryStudyHabit(h));
      const pausedMatch = habits.find((h) => h.status === 'paused' && matchesPrimaryStudyHabit(h));

      if (existingMatch) {
        addedHabitIds.push(existingMatch.id);
      } else if (pausedMatch) {
        const isPremium = userProfile?.plan === 'premium';
        const activeCount = habits.filter((h) => h.status === 'active').length;
        if (!isPremium && activeCount >= 3) {
          setActiveFeedback('Free plan limit reached. Pause an active habit before resuming the study routine.');
          setTimeout(() => setActiveFeedback(null), 4500);
          return;
        }
        await updateHabit(pausedMatch.id, { status: 'active', pausedReason: '' });
        addedHabitIds.push(pausedMatch.id);
      } else {
        // Check free plan active limit (3 active habits)
        const isPremium = userProfile?.plan === 'premium';
        const activeCount = habits.filter((h) => h.status === 'active').length;

        if (!isPremium && activeCount >= 3) {
          // Don't activate a challenge that cannot record a study habit due to the free-plan limit.
          setActiveFeedback('Free plan limit reached. Pause an active habit, then start the Study Challenge again.');
          setTimeout(() => setActiveFeedback(null), 4500);
          return;
        }

        // Create the primary study stack.
        const newId = await addHabit({
          title: primaryTemplate.title,
          anchor: primaryTemplate.anchor,
          action: primaryTemplate.action,
          category: 'Work',
          frequency: 'daily',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          durationMinutes: primaryTemplate.durationMinutes,
          scheduledTime: '09:00 AM',
          status: 'active',
        });
        addedHabitIds.push(newId);
      }

      // Update challenge profile state
      await updatePreferences({
        studyChallenge: {
          isActive: true,
          startedAt: new Date().toISOString(),
          targetDays: 21,
          habitIds: addedHabitIds,
        },
      });

      setActiveFeedback('21-Day Study Challenge initiated! Day 1 starts today. 🎓');
      setTimeout(() => setActiveFeedback(null), 4500);
    } catch (err: unknown) {
      console.error('Failed to start study challenge:', err);
      setActiveFeedback('Could not activate challenge. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  // Add individual secondary study template
  const handleAddTemplate = async (template: typeof STUDY_CHALLENGE_TEMPLATES[0]) => {
    try {
      // Check for duplicate
      const alreadyExists = habits.some(
        (h) => h.title.toLowerCase() === template.title.toLowerCase()
      );
      if (alreadyExists) {
        setActiveFeedback(`“${template.title}” is already in your habits list!`);
        setTimeout(() => setActiveFeedback(null), 3000);
        return;
      }

      const isPremium = userProfile?.plan === 'premium';
      const activeCount = habits.filter((h) => h.status === 'active').length;
      if (!isPremium && activeCount >= 3) {
        setActiveFeedback('Free plan limit (3 active habits) reached. Upgrade or pause a habit to add more.');
        setTimeout(() => setActiveFeedback(null), 4000);
        return;
      }

      const newId = await addHabit({
        title: template.title,
        anchor: template.anchor,
        action: template.action,
        category: template.category,
        frequency: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        durationMinutes: template.durationMinutes,
        scheduledTime: '10:00 AM',
        status: 'active',
      });

      // Update habitIds in challenge
      if (studyChallenge) {
        await updatePreferences({
          studyChallenge: {
            ...studyChallenge,
            habitIds: [...(studyChallenge.habitIds || []), newId],
          },
        });
      }

      setActiveFeedback(`Added “${template.title}”!`);
      setTimeout(() => setActiveFeedback(null), 3000);
    } catch {
      setActiveFeedback('Failed to add template.');
    }
  };

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F0E6DA] tactile-card space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black border border-blue-200/70">
            <span className="text-sm">🎓</span>
            <span>Student Differentiator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#152238] tracking-tight">
            21-Day Study Habit Challenge
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Transform study anxiety into consistent daily momentum using atomic habit stacking.
          </p>
        </div>

        {isChallengeActive ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-full bg-[#EAF7D5] text-[#1E3805] text-xs font-black border border-[#B8E36A] flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#B8E36A] animate-pulse" />
              <span>Day {daysSinceStart} of 21</span>
            </span>
          </div>
        ) : (
          <button
            onClick={handleStartChallenge}
            disabled={isStarting}
            className="px-5 py-3 rounded-2xl tactile-coral text-white text-xs sm:text-sm font-black cursor-pointer shadow-sm hover:scale-[1.02] transition-all shrink-0 flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            <span>{isStarting ? 'Starting…' : 'Start 21-Day Challenge'}</span>
          </button>
        )}
      </div>

      {/* Notification / Feedback */}
      {activeFeedback && (
        <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#FF704F]/40 text-xs text-[#152238] font-bold animate-fadeIn flex items-center justify-between">
          <span>{activeFeedback}</span>
          <button onClick={() => setActiveFeedback(null)} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Active Challenge Dashboard */}
      {isChallengeActive ? (
        <div className="space-y-4">
          {/* Metrics bar */}
          <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-black text-slate-500 uppercase tracking-wide">
                Challenge Adherence
              </div>
              <div className="text-base sm:text-lg font-black text-[#152238]">
                {completedDaysCount} of 21 Days Completed ({progressPercent}%)
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Today's Session
                </span>
                <span className={`text-xs font-black ${isTodayStudyCompleted ? 'text-[#1E3805]' : 'text-amber-800'}`}>
                  {isTodayStudyCompleted ? 'Completed ✓' : 'Pending Study Session ⏳'}
                </span>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black shrink-0 ${
                isTodayStudyCompleted ? 'bg-[#EAF7D5] text-[#1E3805] border border-[#B8E36A]' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {isTodayStudyCompleted ? '🔥' : '📖'}
              </div>
            </div>
          </div>

          {/* 21-Day Visual Progress Track */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-black text-slate-500">
              <span>Day 1</span>
              <span className="text-[#FF704F]">Target: 21 Days</span>
              <span>Day 21</span>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-21 gap-1.5">
              {Array.from({ length: 21 }, (_, idx) => {
                const dayNum = idx + 1;
                const isDone = dayNum <= completedDaysCount;
                const isCurrent = dayNum === daysSinceStart;

                return (
                  <div
                    key={dayNum}
                    title={`Day ${dayNum}: ${isDone ? 'Completed' : isCurrent ? 'Today' : 'Upcoming'}`}
                    className={`h-7 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black transition-all ${
                      isDone
                        ? 'bg-[#B8E36A] text-[#1E3805] shadow-2xs font-extrabold'
                        : isCurrent
                        ? 'bg-[#FFEEDB] text-[#FF704F] ring-2 ring-[#FF704F] scale-105 font-bold'
                        : 'bg-[#F5EFE6] text-slate-400 font-medium'
                    }`}
                  >
                    {isDone ? '✓' : dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Linked Study Habits */}
          <div className="space-y-2.5 pt-2">
            <div className="text-xs font-black text-[#152238] flex items-center justify-between">
              <span>Your Active Study Stacks</span>
              {studyHabits.length > 0 && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {activeStudyHabits.length} active · {pausedStudyHabitsCount} paused
                </span>
              )}
            </div>

            {studyHabits.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>No study habits currently active. Choose a template below to add one!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {studyHabits.map((habit) => {
                  const isPaused = habit.status !== 'active';
                  const isDone = !isPaused && isHabitCompletedOnDate(habit.id, todayDateStr);
                  return (
                    <div
                      key={habit.id}
                      className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-black text-[#152238] truncate">{habit.title}</div>
                          {isPaused && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-black shrink-0">
                              Paused
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          After {habit.anchor} → {habit.action}
                        </div>
                      </div>
                      {isPaused ? (
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">Not counted</span>
                      ) : (
                        <button
                          onClick={() => toggleCompletion(habit.id)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all shrink-0 cursor-pointer ${
                            isDone
                              ? 'bg-[#B8E36A] text-[#1E3805] ring-2 ring-[#B8E36A]/50'
                              : 'bg-white border border-slate-300 text-slate-400 hover:border-[#FF704F]'
                          }`}
                          title={isDone ? 'Mark as incomplete' : 'Check off today’s study session'}
                        >
                          {isDone ? '✓' : ''}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Ready-Made Study Habit Stacks Preview */
        <div className="space-y-3">
          <div className="text-xs font-black text-slate-500 uppercase tracking-wide">
            Ready-Made Study Habit Stacks
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STUDY_CHALLENGE_TEMPLATES.map((tmpl, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] flex flex-col justify-between gap-3 hover:border-[#FF704F]/60 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#152238]">{tmpl.title}</span>
                    <CategoryBadge category={tmpl.category} size="sm" />
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    <span className="font-bold text-[#152238]">After:</span> {tmpl.anchor}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    <span className="font-bold text-[#152238]">Action:</span> {tmpl.action}
                  </div>
                </div>

                <button
                  onClick={() => handleAddTemplate(tmpl)}
                  className="w-full py-2 rounded-xl bg-white hover:bg-[#FFF1EE] text-[#FF704F] border border-[#FF704F]/40 text-xs font-black cursor-pointer transition-colors shadow-2xs"
                >
                  + Add to My Habits
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Mode & Sync Notice */}
      {isGuest && !currentUser && (
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">info</span>
          <span>
            Challenge progress is saved on this device. Sign in with Google anytime to back up your 21-day study streak to Firestore.
          </span>
        </div>
      )}
    </section>
  );
};
