import React from 'react';
import { useHabits } from '../context/HabitsContext.tsx';
import { HabitBuddy } from './HabitBuddy.tsx';

interface CelebrationModalProps {
  onBackToDashboard: () => void;
  onViewAnalytics: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  onBackToDashboard,
  onViewAnalytics,
}) => {
  const {
    celebrationData,
    closeCelebration,
    streakStats,
    todayHabits,
    isHabitCompletedOnDate,
    todayDateStr,
  } = useHabits();

  if (!celebrationData) return null;

  const totalToday = todayHabits.length || 1;
  const completedToday = todayHabits.filter((h) =>
    isHabitCompletedOnDate(h.id, todayDateStr)
  ).length;
  const streakDays = celebrationData.streak || streakStats.currentStreak;
  const isMilestone = celebrationData.type.startsWith('milestone');
  const isAllDone = celebrationData.type === 'all_done' || (!isMilestone && completedToday >= totalToday);

  const handleContinue = () => {
    closeCelebration();
    onBackToDashboard();
  };

  const handleViewProgress = () => {
    closeCelebration();
    onViewAnalytics();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCelebration();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#152238]/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn"
    >
      <div className="relative z-10 w-full max-w-[480px] bg-white border border-[#F0E6DA] rounded-3xl p-6 sm:p-8 tactile-card-modal text-center my-6">
        {/* Animated Mascot / Milestone Badge */}
        <div className="relative mx-auto mb-4 flex items-center justify-center">
          <HabitBuddy mood="celebrating" size="lg" className="buddy-cheer" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-[#152238] mb-1.5 tracking-tight">
          {isMilestone
            ? celebrationData.milestoneTitle
            : isAllDone
            ? 'Amazing! You showed up today! 🎉'
            : 'Habit Completed! 🎉'}
        </h2>

        {/* Subtitle / Encouraging Message */}
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mb-5 leading-relaxed font-medium">
          {isMilestone ? (
            celebrationData.milestoneMessage
          ) : celebrationData.action ? (
            <>
              You executed your stack:
              <span className="block mt-1 font-extrabold text-[#1E3805] bg-[#EAF7D5] px-3 py-1.5 rounded-xl border border-[#B8E36A]">
                {celebrationData.action}
              </span>
            </>
          ) : (
            'Amazing! You showed up today and stayed consistent with your habits.'
          )}
        </p>

        {/* Clean Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-amber-200 flex flex-col items-center">
            <span className="text-xl mb-0.5 flame-wiggle">🔥</span>
            <span className="text-base sm:text-lg font-black text-[#152238] leading-tight">
              {streakDays} Day{streakDays === 1 ? '' : 's'}
            </span>
            <span className="text-[11px] font-bold text-amber-800">Current Streak</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAFDF5] border border-[#B8E36A] flex flex-col items-center">
            <span className="text-xl mb-0.5">✅</span>
            <span className="text-base sm:text-lg font-black text-[#152238] leading-tight">
              {completedToday} of {totalToday}
            </span>
            <span className="text-[11px] font-bold text-[#1E3805]">
              {isAllDone ? 'All Done Today!' : 'Daily Progress'}
            </span>
          </div>
        </div>

        {/* Encouraging Quote */}
        <div className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] mb-6 text-xs text-slate-700 font-medium">
          {isMilestone
            ? '“Every action you take is a vote for the type of person you wish to become.”'
            : '“Small steps every day lead to stunning, lasting results.”'}
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            onClick={handleContinue}
            className="w-full sm:flex-1 py-3 px-6 rounded-2xl tactile-coral text-sm font-black cursor-pointer shadow-md transition-all"
          >
            {isMilestone ? 'Claim Milestone' : 'Continue'}
          </button>
          <button
            onClick={handleViewProgress}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl tactile-ghost text-xs font-black cursor-pointer transition-colors"
          >
            View Milestones
          </button>
        </div>
      </div>
    </div>
  );
};
