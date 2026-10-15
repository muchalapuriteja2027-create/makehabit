import React, { useState } from 'react';
import { useHabits } from '../context/HabitsContext.tsx';
import { DayStreakStatus, Milestone } from '../types.ts';
import { HabitBuddy } from './HabitBuddy.tsx';

interface ProgressViewProps {
  onBackToHome: () => void;
  onOpenNewStack: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  onBackToHome,
  onOpenNewStack: _onOpenNewStack,
}) => {
  const { streakStats, habits, completions, triggerMilestoneCelebration } = useHabits();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    streakStats.past7Days.length - 1
  );

  const selectedDay: DayStreakStatus =
    streakStats.past7Days[selectedDayIndex] ||
    streakStats.past7Days[streakStats.past7Days.length - 1];

  const currentStreak = streakStats.currentStreak;
  const longestStreak = streakStats.longestStreak;
  const totalCompleted = streakStats.totalCompletionsCount;
  const totalHabitsCount = habits.length;

  const milestones: Milestone[] = [
    {
      id: 'first_stack',
      title: 'First Step',
      badge: '🌟',
      description: 'Create your first habit stack',
      requiredMetric: 1,
      currentProgress: Math.min(100, Math.round((totalHabitsCount / 1) * 100)),
      isUnlocked: totalHabitsCount >= 1,
    },
    {
      id: 'streak_3',
      title: '3-Day Spark',
      badge: '🔥',
      description: 'Complete habits for 3 consecutive days',
      requiredMetric: 3,
      currentProgress: Math.min(100, Math.round((currentStreak / 3) * 100)),
      isUnlocked: currentStreak >= 3,
    },
    {
      id: 'streak_7',
      title: '7-Day Momentum',
      badge: '⚡',
      description: 'Build an unbroken 7-day streak',
      requiredMetric: 7,
      currentProgress: Math.min(100, Math.round((currentStreak / 7) * 100)),
      isUnlocked: currentStreak >= 7,
    },
    {
      id: 'streak_14',
      title: '14-Day Master',
      badge: '🏆',
      description: 'Reach a 14-day habit streak',
      requiredMetric: 14,
      currentProgress: Math.min(100, Math.round((longestStreak / 14) * 100)),
      isUnlocked: longestStreak >= 14,
    },
  ];

  // Habit consistency statistics based on real completions over the past 7 days
  const habitConsistencyList = habits.map((habit) => {
    let completedCount = 0;
    const windowDays = 7;
    for (let i = 0; i < windowDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const key = `${iso}_${habit.id}`;
      if (completions[key]?.completed) {
        completedCount++;
      }
    }
    const rate = Math.round((completedCount / windowDays) * 100);
    return {
      habit,
      rate,
      completedCount,
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1EE] text-[#FF704F] text-xs font-black mb-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Habit Momentum</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#152238] tracking-tight">
            Progress & Consistency
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Track your unbroken daily streaks and genuine consistency milestones.
          </p>
        </div>

        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#F0E6DA] hover:bg-[#FFF8F0] text-[#152238] text-xs font-black transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back to Today</span>
        </button>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Current Streak with Warm Amber Accents */}
        <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] rounded-3xl p-5 border border-amber-200/90 tactile-card flex flex-col justify-between shadow-2xs">
          <span className="text-2xl mb-2 flame-wiggle">🔥</span>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#152238] leading-tight">
              {currentStreak} Day{currentStreak === 1 ? '' : 's'}
            </div>
            <span className="text-xs font-black text-amber-900">Current Streak</span>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="bg-gradient-to-br from-[#FFF8F0] to-[#FFEEDB] rounded-3xl p-5 border border-[#F0E6DA] tactile-card flex flex-col justify-between shadow-2xs">
          <span className="text-2xl mb-2">🏆</span>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#152238] leading-tight">
              {longestStreak} Day{longestStreak === 1 ? '' : 's'}
            </div>
            <span className="text-xs font-black text-[#FF704F]">Personal Best</span>
          </div>
        </div>

        {/* Total Habits Executed */}
        <div className="bg-white rounded-3xl p-5 border border-[#F0E6DA] tactile-card flex flex-col justify-between shadow-2xs">
          <span className="text-2xl mb-2">✅</span>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#152238] leading-tight">
              {totalCompleted}
            </div>
            <span className="text-xs font-black text-[#1E3805]">Total Completions</span>
          </div>
        </div>

        {/* 7-Day Consistency Adherence */}
        <div className="bg-white rounded-3xl p-5 border border-[#F0E6DA] tactile-card flex flex-col justify-between shadow-2xs">
          <span className="text-2xl mb-2">⚡</span>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#152238] leading-tight">
              {streakStats.weeklyAdherencePercent}%
            </div>
            <span className="text-xs font-black text-[#152238]">7-Day Adherence</span>
          </div>
        </div>
      </div>

      {/* 7-Day Consistency Chain */}
      <section className="bg-white rounded-3xl border border-[#F0E6DA] p-6 sm:p-7 tactile-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#152238]">
              Past 7 Days Consistency
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Tap any day to view completion breakdown.
            </p>
          </div>
          <span className="text-xs font-black text-[#FF704F] bg-[#FFF1EE] px-3 py-1 rounded-full self-start sm:self-auto">
            {currentStreak}-day active streak
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-2">
          {streakStats.past7Days.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const isDone = day.isAllCompleted;
            const hasSome = day.completedCount > 0;
            return (
              <div
                key={day.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#FFF8F0] ring-2 ring-[#FF704F]'
                    : 'hover:bg-[#FAF8F5]'
                }`}
              >
                <span
                  className={`text-xs font-black mb-1.5 ${
                    day.isToday ? 'text-[#FF704F]' : 'text-slate-400'
                  }`}
                >
                  {day.dayLabel}
                </span>
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-sm font-black transition-transform ${
                    isDone
                      ? 'bg-[#B8E36A] text-[#1E3805] shadow-xs'
                      : hasSome
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : hasSome ? '·' : '—'}
                </div>
                <span className="text-[11px] font-black text-slate-700 mt-2">
                  {day.completedCount}/{day.totalHabitsDue}
                </span>
              </div>
            );
          })}
        </div>

        {/* Selected Day Info Card */}
        <div className="p-4 bg-[#FFF8F0] rounded-2xl border border-[#F0E6DA] flex items-center justify-between text-xs text-slate-700">
          <div>
            <span className="font-black text-[#152238]">
              {selectedDay.dayLabel} ({selectedDay.displayDate}):
            </span>{' '}
            <span className="font-semibold text-slate-600">
              {selectedDay.completedCount} of {selectedDay.totalHabitsDue} habits completed.
            </span>
          </div>
          <span className="font-black text-[#1E3805] bg-[#EAF7D5] px-2.5 py-1 rounded-full border border-[#B8E36A]">
            {selectedDay.isAllCompleted
              ? 'Complete! 🎉'
              : selectedDay.completedCount > 0
              ? 'In Progress ⏳'
              : 'None completed'}
          </span>
        </div>
      </section>

      {/* Genuine Milestones (3-day, 7-day, 14-day streaks) */}
      <section className="bg-white rounded-3xl border border-[#F0E6DA] p-6 sm:p-7 tactile-card space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#152238]">
            Consistency Milestones
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Earned through continuous dedication. Click any unlocked milestone to celebrate!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {milestones.map((m) => (
            <div
              key={m.id}
              onClick={() => {
                if (m.isUnlocked && (m.id === 'streak_3' || m.id === 'streak_7' || m.id === 'streak_14')) {
                  triggerMilestoneCelebration(m.id as 'streak_3' | 'streak_7' | 'streak_14');
                }
              }}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                m.isUnlocked
                  ? 'bg-gradient-to-r from-[#FFFBEB] to-[#FAFDF5] border-amber-200/90 shadow-2xs cursor-pointer hover:scale-[1.01]'
                  : 'bg-slate-50/70 border-slate-200/60 opacity-75'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-2xs ${
                  m.isUnlocked
                    ? 'bg-amber-100 ring-2 ring-amber-300'
                    : 'bg-slate-200/80 grayscale'
                }`}
              >
                {m.badge}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#152238] truncate">{m.title}</h3>
                  {m.isUnlocked ? (
                    <span className="text-[10px] font-black text-[#1E3805] bg-[#EAF7D5] px-2 py-0.5 rounded-full border border-[#B8E36A]">
                      Unlocked ✓
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-snug font-medium">{m.description}</p>

                {/* Real Progress Bar */}
                <div className="w-full bg-slate-200/70 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      m.isUnlocked
                        ? 'bg-[#B8E36A]'
                        : 'bg-[#FF704F]'
                    }`}
                    style={{ width: `${m.currentProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Habit Retention Breakdown */}
      {habitConsistencyList.length > 0 && (
        <section className="bg-white rounded-3xl border border-[#F0E6DA] p-6 sm:p-7 tactile-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#152238]">
                Habit Consistency Breakdown
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Completion rate for each of your active routines over the past 7 days.
              </p>
            </div>
            <HabitBuddy mood="happy" size="sm" className="hidden sm:inline-flex" />
          </div>

          <div className="space-y-3">
            {habitConsistencyList.map(({ habit, rate, completedCount }) => (
              <div
                key={habit.id}
                className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-black text-[#152238] flex items-center gap-2">
                    <span>{habit.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Anchor: <span className="text-[#152238] font-bold">{habit.anchor}</span> ➔{' '}
                    <span className="text-[#FF704F] font-bold">{habit.action}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-bold text-slate-600">
                    {completedCount}/7 days ({rate}%)
                  </span>
                  <div className="w-24 bg-[#F0E6DA] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#B8E36A] h-full rounded-full transition-all"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
