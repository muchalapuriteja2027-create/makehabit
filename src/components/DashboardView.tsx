import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useHabits } from '../context/HabitsContext.tsx';
import { HabitStack, getCleanAnchorTitle, getCleanActionTitle, formatHabitSentence } from '../types.ts';
import { CategoryBadge } from './CategoryBadge.tsx';
import { HabitBuddy } from './HabitBuddy.tsx';

interface DashboardViewProps {
  onOpenNewStack: () => void;
  onEditHabit: (habit: HabitStack) => void;
}

function getAnchorIcon(anchor: string): string {
  const emojiMatch = anchor.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u);
  if (emojiMatch) return emojiMatch[0];
  const lower = anchor.toLowerCase();
  if (lower.includes('tea') || lower.includes('coffee')) return '☕';
  if (lower.includes('bed') || lower.includes('wake') || lower.includes('morning')) return '🛏️';
  if (lower.includes('lunch') || lower.includes('eat') || lower.includes('dinner')) return '🥗';
  if (lower.includes('laptop') || lower.includes('work') || lower.includes('desk')) return '💻';
  if (lower.includes('teeth') || lower.includes('brush')) return '🪥';
  if (lower.includes('shower') || lower.includes('bath')) return '🚿';
  return '⏰';
}

function getActionIcon(action: string): string {
  const emojiMatch = action.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u);
  if (emojiMatch) return emojiMatch[0];
  const lower = action.toLowerCase();
  if (lower.includes('read') || lower.includes('book')) return '📚';
  if (lower.includes('water') || lower.includes('drink')) return '💧';
  if (lower.includes('pushup') || lower.includes('gym') || lower.includes('workout')) return '💪';
  if (lower.includes('stretch') || lower.includes('yoga') || lower.includes('meditat')) return '🧘';
  if (lower.includes('walk') || lower.includes('run')) return '🚶';
  if (lower.includes('journal') || lower.includes('write')) return '✍️';
  return '🎯';
}

const ENCOURAGING_QUOTES = [
  'Amazing! You showed up today! 🎉',
  'One more habit closer to your goal! ⭐',
  'Boom! That’s consistency in action! 🚀',
  'Look at that momentum building! 🔥',
  'Small steps every day lead to big changes! 🌱',
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewStack,
  onEditHabit,
}) => {
  const { userProfile } = useAuth();
  const {
    todayHabits,
    habits,
    streakStats,
    isHabitCompletedOnDate,
    toggleCompletion,
    todayDateStr,
    loading,
    addHabit,
    deleteHabit,
  } = useHabits();

  const [activeFeedback, setActiveFeedback] = useState<{
    text: string;
    subText?: string;
    habitId?: string;
  } | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [isStreakPopping, setIsStreakPopping] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<HabitStack | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Time-aware greeting
  const currentHour = new Date().getHours();
  const greetingTime =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 17
      ? 'Good afternoon'
      : 'Good evening';
  const greetingIcon = currentHour < 17 ? '☀️' : '🌙';

  const firstName = userProfile?.displayName
    ? userProfile.displayName.split(' ')[0]
    : 'Friend';

  // Metrics
  const totalDueToday = todayHabits.length;
  const completedTodayCount = todayHabits.filter((h) =>
    isHabitCompletedOnDate(h.id, todayDateStr)
  ).length;

  const percentComplete =
    totalDueToday > 0
      ? Math.round((completedTodayCount / totalDueToday) * 100)
      : 0;

  const isAllTodayDone = totalDueToday > 0 && completedTodayCount >= totalDueToday;

  // Pulse streak when completions change
  useEffect(() => {
    if (completedTodayCount > 0) {
      setIsStreakPopping(true);
      const timer = setTimeout(() => setIsStreakPopping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [completedTodayCount, streakStats.currentStreak]);

  const handleToggle = async (habit: HabitStack) => {
    const isNowDone = await toggleCompletion(habit.id);
    const cleanAction = getCleanActionTitle(habit.action);

    if (isNowDone) {
      setJustCompletedId(habit.id);
      const remainingAfter = totalDueToday - (completedTodayCount + 1);
      const randomQuote =
        remainingAfter === 0
          ? 'Amazing! You showed up today! All habits complete! 🎉'
          : remainingAfter === 1
          ? 'One more habit closer to your goal! ⭐'
          : ENCOURAGING_QUOTES[Math.floor(Math.random() * ENCOURAGING_QUOTES.length)];

      setActiveFeedback({
        text: `“${cleanAction}” completed!`,
        subText: randomQuote,
        habitId: habit.id,
      });
      setTimeout(() => setJustCompletedId(null), 1500);
    } else {
      setActiveFeedback({
        text: `Marked “${cleanAction}” as incomplete.`,
        habitId: habit.id,
      });
    }
    setTimeout(() => setActiveFeedback(null), 4500);
  };

  const handleUndo = async (habitId: string) => {
    await toggleCompletion(habitId);
    setActiveFeedback(null);
  };

  const handleAdoptTemplate = async (template: {
    anchor: string;
    action: string;
    category: 'Health' | 'Work' | 'Personal';
    title: string;
  }) => {
    try {
      await addHabit({
        title: template.title,
        anchor: template.anchor,
        action: template.action,
        category: template.category,
        frequency: 'daily',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        durationMinutes: 15,
        scheduledTime: '08:00 AM',
        status: 'active',
      });
      setActiveFeedback({
        text: `Added “${template.title}” to your routines!`,
        subText: 'Amazing! You showed up today! 🎉',
      });
      setTimeout(() => setActiveFeedback(null), 3500);
    } catch {
      setActiveFeedback({
        text: 'Could not add template. Please try again.',
      });
      setTimeout(() => setActiveFeedback(null), 3000);
    }
  };

  const confirmDelete = async () => {
    if (!habitToDelete) return;
    setIsDeleting(true);
    try {
      await deleteHabit(habitToDelete.id);
      setHabitToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16 md:pb-6">
      {/* Playful Floating Toast with Animated Character & Instant Undo */}
      {activeFeedback && (
        <div className="fixed top-20 right-4 z-50 bg-[#152238] text-white px-4 py-3 rounded-3xl shadow-2xl flex items-center gap-3.5 text-xs sm:text-sm font-bold border-2 border-[#FF704F] animate-fadeIn max-w-sm">
          <HabitBuddy mood="celebrating" size="sm" className="shrink-0 buddy-cheer" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span>{activeFeedback.text}</span>
            </div>
            {activeFeedback.subText && (
              <p className="text-[11px] text-[#B8E36A] font-semibold mt-0.5 leading-snug">
                {activeFeedback.subText}
              </p>
            )}
          </div>
          {activeFeedback.habitId && (
            <button
              onClick={() => handleUndo(activeFeedback.habitId!)}
              className="px-2.5 py-1 bg-[#243552] hover:bg-[#2d4264] text-[#B8E36A] rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {habitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#152238]/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl">
              🗑️
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#152238]">Delete Habit?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete “{habitToDelete.title}”? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setHabitToDelete(null)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header Greeting & Streak Bar */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0E6DA] tactile-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <HabitBuddy mood={isAllTodayDone ? 'celebrating' : 'happy'} size="md" className="shrink-0 hidden sm:inline-flex" />
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1EE] text-[#FF704F] text-xs font-black mb-1">
              <span>{greetingIcon}</span>
              <span>MakeHabit Momentum</span>
            </div>
            <h1 className="text-2xl sm:text-3xl text-[#152238] font-black tracking-tight">
              {greetingTime}, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {totalDueToday === 0
                ? 'No habit stacks scheduled for today. Create your first habit below!'
                : isAllTodayDone
                ? '🎉 Amazing! You showed up today! All habits are completed.'
                : totalDueToday - completedTodayCount === 1
                ? '⭐ One more habit closer to your daily goal!'
                : `You have ${totalDueToday - completedTodayCount} habits remaining today. Keep building momentum!`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          {/* Prominent Current Streak Badge */}
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-amber-200/90 text-amber-900 shadow-2xs transition-all ${
              isStreakPopping ? 'streak-pop ring-2 ring-amber-400' : ''
            }`}
          >
            <span className="text-2xl flame-wiggle drop-shadow-xs">🔥</span>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-black text-amber-800 block">
                Current Streak
              </span>
              <span className="text-base sm:text-lg font-black leading-tight text-[#152238]">
                {streakStats.currentStreak} Day{streakStats.currentStreak === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* + Create Habit Button (Coral Orange) */}
          <button
            onClick={onOpenNewStack}
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl tactile-coral text-xs sm:text-sm font-black cursor-pointer shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Create Habit</span>
          </button>
        </div>
      </section>

      {/* 2. Today's Progress & Weekly Visual */}
      <section className="bg-white rounded-3xl p-6 border border-[#F0E6DA] tactile-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                Today's Progress
              </span>
              {percentComplete === 100 && (
                <span className="text-[11px] font-black text-[#1E3805] bg-[#EAF7D5] px-2.5 py-0.5 rounded-full border border-[#B8E36A]">
                  Goal reached! 🎉
                </span>
              )}
            </div>
            <div className="text-lg sm:text-xl font-black text-[#152238] mt-0.5">
              {completedTodayCount} of {totalDueToday} completed ({percentComplete}%)
            </div>
          </div>

          {/* 7-Day Consistency Visual */}
          <div className="flex items-center gap-2">
            {streakStats.past7Days.map((day) => {
              const isDone = day.isAllCompleted;
              const hasSome = day.completedCount > 0;
              return (
                <div key={day.date} className="flex flex-col items-center">
                  <span
                    className={`text-[11px] font-bold mb-1 ${
                      day.isToday ? 'text-[#FF704F] font-black' : 'text-slate-400'
                    }`}
                  >
                    {day.dayShort}
                  </span>
                  <div
                    title={`${day.displayDate}: ${day.completedCount}/${day.totalHabitsDue} completed`}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                      day.isToday && isDone
                        ? 'bg-[#B8E36A] text-[#1E3805] ring-2 ring-[#B8E36A]/60 scale-105 shadow-xs pop-check'
                        : isDone
                        ? 'bg-[#EAF7D5] text-[#1E3805] border border-[#B8E36A]'
                        : hasSome
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? '✓' : hasSome ? '·' : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-[#F5EFE6] rounded-full h-3.5 overflow-hidden shadow-inner">
          <div
            className={`h-full bg-gradient-to-r from-[#FF704F] to-[#B8E36A] rounded-full transition-all duration-500 ease-out ${
              isStreakPopping ? 'progress-active' : ''
            }`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </section>

      {/* 3. All Today Done Encouraging Banner */}
      {isAllTodayDone && (
        <section className="bg-gradient-to-r from-[#FF704F] to-[#FA8C73] text-white rounded-3xl p-5 sm:p-6 shadow-md flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-4">
            <HabitBuddy mood="celebrating" size="md" className="shrink-0" />
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Amazing! You showed up today! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-white/90 mt-0.5 font-medium">
                All routines checked off for today. Your {streakStats.currentStreak}-day streak is secured!
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 4. Today's Habits Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#152238] tracking-tight">
              Today's Habits
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1EE] text-[#FF704F] text-xs font-black">
              {totalDueToday}
            </span>
          </div>

          {habits.length > 0 && (
            <button
              onClick={onOpenNewStack}
              className="text-xs font-extrabold text-[#FF704F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ Add another routine</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#F0E6DA]">
            <span className="material-symbols-outlined text-3xl text-[#FF704F] animate-spin">
              sync
            </span>
            <p className="text-xs text-slate-400 mt-2 font-medium">Loading your habits...</p>
          </div>
        ) : todayHabits.length === 0 ? (
          /* Empty State & Starter Routines */
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#F0E6DA] text-center space-y-6 tactile-card">
            <HabitBuddy mood="happy" size="lg" className="mx-auto" />
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-black text-[#152238]">
                {habits.length === 0
                  ? 'Ready to build your first habit stack?'
                  : 'No habits scheduled for today'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Stack a new habit onto something you already do every single day.
                Choose an existing routine as the anchor, then perform your new habit immediately after.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenNewStack}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full tactile-coral text-sm font-black shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>Create Your First Habit</span>
              </button>
            </div>

            {/* Optional Starter Templates */}
            {habits.length === 0 && (
              <div className="pt-6 border-t border-[#F0E6DA] text-left">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3 text-center sm:text-left">
                  Or pick a starter routine to begin:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] flex items-center justify-between gap-3 hover:border-[#FF704F] transition-colors">
                    <div className="space-y-1">
                      <div className="text-sm font-black text-[#152238]">
                        ☕ After my morning tea
                      </div>
                      <div className="text-xs font-bold text-slate-600">
                        📚 I will read for 15 minutes
                      </div>
                      <div className="pt-0.5">
                        <CategoryBadge category="Personal" size="sm" />
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleAdoptTemplate({
                          anchor: 'my morning tea',
                          action: 'read for 15 minutes',
                          category: 'Personal',
                          title: 'Morning Reading Routine',
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF1EE] text-[#FF704F] border border-[#FF704F]/40 text-xs font-black cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] flex items-center justify-between gap-3 hover:border-[#FF704F] transition-colors">
                    <div className="space-y-1">
                      <div className="text-sm font-black text-[#152238]">
                        🛏️ After stepping out of bed
                      </div>
                      <div className="text-xs font-bold text-slate-600">
                        🧘 I will stretch for 10 minutes
                      </div>
                      <div className="pt-0.5">
                        <CategoryBadge category="Health" size="sm" />
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleAdoptTemplate({
                          anchor: 'stepping out of bed',
                          action: 'stretch for 10 minutes',
                          category: 'Health',
                          title: 'Morning Stretch',
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF1EE] text-[#FF704F] border border-[#FF704F]/40 text-xs font-black cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] flex items-center justify-between gap-3 hover:border-[#FF704F] transition-colors">
                    <div className="space-y-1">
                      <div className="text-sm font-black text-[#152238]">
                        🥗 After finishing lunch
                      </div>
                      <div className="text-xs font-bold text-slate-600">
                        🚶 I will walk outside for 15 minutes
                      </div>
                      <div className="pt-0.5">
                        <CategoryBadge category="Health" size="sm" />
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleAdoptTemplate({
                          anchor: 'finishing lunch',
                          action: 'walk outside for 15 minutes',
                          category: 'Health',
                          title: 'Midday Walk',
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF1EE] text-[#FF704F] border border-[#FF704F]/40 text-xs font-black cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] flex items-center justify-between gap-3 hover:border-[#FF704F] transition-colors">
                    <div className="space-y-1">
                      <div className="text-sm font-black text-[#152238]">
                        💻 After closing my laptop
                      </div>
                      <div className="text-xs font-bold text-slate-600">
                        📝 I will plan top 3 priorities for tomorrow
                      </div>
                      <div className="pt-0.5">
                        <CategoryBadge category="Work" size="sm" />
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleAdoptTemplate({
                          anchor: 'closing my work laptop',
                          action: 'plan top 3 priorities for tomorrow',
                          category: 'Work',
                          title: 'Work Shutdown Routine',
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF1EE] text-[#FF704F] border border-[#FF704F]/40 text-xs font-black cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Habit Cards Feed — Clean, Uncluttered, Consumer Product Feel */
          <div className="space-y-4">
            {todayHabits.map((habit) => {
              const isCompleted = isHabitCompletedOnDate(habit.id, todayDateStr);
              const anchorIcon = getAnchorIcon(habit.anchor);
              const actionIcon = getActionIcon(habit.action);
              // Format anchor and action cleanly, removing duplicate "After" and "I will"
              const cleanAnchorTitle = getCleanAnchorTitle(habit.anchor);
              const cleanActionTitle = getCleanActionTitle(habit.action);
              const naturalSentence = formatHabitSentence(habit.anchor, habit.action);
              const isJustDone = justCompletedId === habit.id;

              return (
                <article
                  key={habit.id}
                  className={`rounded-3xl p-5 sm:p-6 border transition-all duration-200 ${
                    isCompleted
                      ? 'border-[#B8E36A] bg-[#FAFDF5] shadow-xs'
                      : 'border-[#F0E6DA] bg-white tactile-card hover:border-[#FF704F]/60 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    {/* Left: Routine narrative */}
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Routine Anchor Line: ☕ After my morning tea (No duplicate "After") */}
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">{anchorIcon}</span>
                        <span className="text-base sm:text-lg font-black text-[#152238] tracking-tight">
                          After {cleanAnchorTitle}
                        </span>
                      </div>

                      {/* Target Habit Line: 📚 I will read for 15 minutes */}
                      <div className="flex items-center gap-2 text-slate-800">
                        <span className="text-xl shrink-0">{actionIcon}</span>
                        <span
                          className={`text-base font-extrabold transition-all ${
                            isCompleted
                              ? 'line-through text-slate-400 opacity-80'
                              : 'text-[#152238]'
                          }`}
                        >
                          I will {cleanActionTitle}
                        </span>
                      </div>

                      {/* Natural sentence preview & category */}
                      <div className="flex items-center gap-3 pt-0.5 flex-wrap">
                        <span className="text-[11px] text-slate-500 font-medium italic">
                          “{naturalSentence}”
                        </span>
                        <CategoryBadge category={habit.category} size="sm" />
                      </div>
                    </div>

                    {/* Right: Large Satisfying Mark Complete Action Button & Edit/Delete */}
                    <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-center justify-between sm:justify-end">
                      {/* Secondary Options (Edit / Delete) */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditHabit(habit)}
                          title="Edit Routine"
                          className="p-2 text-slate-400 hover:text-[#152238] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => setHabitToDelete(habit)}
                          title="Delete Routine"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>

                      {/* Large Satisfying Mark Complete Button */}
                      {isCompleted ? (
                        <button
                          onClick={() => handleToggle(habit)}
                          title="Click to undo completion"
                          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl tactile-lime text-xs sm:text-sm font-black transition-all cursor-pointer ${
                            isJustDone ? 'pop-check ring-2 ring-[#B8E36A]' : ''
                          }`}
                        >
                          {/* Animated Checkmark SVG */}
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1E3805] text-white shadow-xs pop-check">
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path className="check-svg-path" d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                          <span>Completed ✓</span>
                          <span className="text-[10px] font-bold opacity-80 underline ml-1">
                            (Undo)
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggle(habit)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl tactile-coral text-xs sm:text-sm font-black cursor-pointer shadow-md transition-all active:scale-98"
                        >
                          <span className="material-symbols-outlined text-lg">check</span>
                          <span>Mark Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
