import React, { useState } from 'react';
import { useHabits } from '../context/HabitsContext.tsx';
import { HabitStack, normalizeCategory, getCleanAnchorTitle, getCleanActionTitle, formatHabitSentence } from '../types.ts';
import { CategoryBadge } from './CategoryBadge.tsx';

interface MyHabitsViewProps {
  onOpenNewStack: () => void;
  onEditHabit: (habit: HabitStack) => void;
}

export const MyHabitsView: React.FC<MyHabitsViewProps> = ({
  onOpenNewStack,
  onEditHabit,
}) => {
  const { habits, togglePauseHabit, deleteHabit } = useHabits();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all');
  const [habitToDelete, setHabitToDelete] = useState<HabitStack | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredHabits = habits.filter((h) => {
    if (filterStatus !== 'all' && h.status !== filterStatus) return false;
    if (filterCategory !== 'all') {
      const norm = normalizeCategory(h.category);
      if (norm !== filterCategory) return false;
    }
    return true;
  });

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

  const healthCount = habits.filter((h) => normalizeCategory(h.category) === 'Health').length;
  const workCount = habits.filter((h) => normalizeCategory(h.category) === 'Work').length;
  const personalCount = habits.filter((h) => normalizeCategory(h.category) === 'Personal').length;
  const uncategorizedCount = habits.filter((h) => normalizeCategory(h.category) === 'Uncategorized').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16 md:pb-6">
      {/* Delete Confirmation Modal */}
      {habitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#152238]/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-[#F0E6DA] text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl">
              🗑️
            </div>
            <div>
              <h3 className="text-base font-black text-[#152238]">Delete Habit?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
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
                className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1EE] text-[#FF704F] text-xs font-black mb-1">
            <span className="material-symbols-outlined text-[16px]">checklist</span>
            <span>Your Habit Stacks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#152238] tracking-tight">
            My Habits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            View, edit, or pause your routines at any time.
          </p>
        </div>

        <button
          onClick={onOpenNewStack}
          className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl tactile-coral text-xs sm:text-sm font-black cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>+ Create Habit</span>
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-3xl border border-[#F0E6DA] shadow-2xs">
        {/* Status filters */}
        <div className="flex items-center gap-1 bg-[#F5EFE6] p-1 rounded-2xl">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-white text-[#152238] shadow-xs'
                : 'text-slate-600 hover:text-[#152238]'
            }`}
          >
            All ({habits.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-white text-[#1E3805] shadow-xs'
                : 'text-slate-600 hover:text-[#152238]'
            }`}
          >
            Active ({habits.filter((h) => h.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('paused')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterStatus === 'paused'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-[#152238]'
            }`}
          >
            Paused ({habits.filter((h) => h.status === 'paused').length})
          </button>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-[#152238] text-white shadow-xs'
                : 'bg-[#FFF8F0] text-slate-600 hover:bg-[#F5EFE6]'
            }`}
          >
            All Categories ({habits.length})
          </button>
          <button
            onClick={() => setFilterCategory('Health')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'Health'
                ? 'bg-[#EAF7D5] border border-[#B8E36A] text-[#1E3805] shadow-xs'
                : 'bg-[#FFF8F0] text-slate-600 hover:bg-[#F5EFE6]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8E36A]" />
            <span>Health ({healthCount})</span>
          </button>
          <button
            onClick={() => setFilterCategory('Work')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'Work'
                ? 'bg-blue-50 border border-blue-300 text-blue-900 shadow-xs'
                : 'bg-[#FFF8F0] text-slate-600 hover:bg-[#F5EFE6]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Work ({workCount})</span>
          </button>
          <button
            onClick={() => setFilterCategory('Personal')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'Personal'
                ? 'bg-purple-50 border border-purple-300 text-purple-900 shadow-xs'
                : 'bg-[#FFF8F0] text-slate-600 hover:bg-[#F5EFE6]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Personal ({personalCount})</span>
          </button>
          {uncategorizedCount > 0 && (
            <button
              onClick={() => setFilterCategory('Uncategorized')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === 'Uncategorized'
                  ? 'bg-slate-200 text-slate-900 shadow-xs'
                  : 'bg-[#FFF8F0] text-slate-600 hover:bg-[#F5EFE6]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Uncategorized ({uncategorizedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Habit Cards Grid */}
      {filteredHabits.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-[#F0E6DA] space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFEEDB] text-[#FF704F] flex items-center justify-center mx-auto text-2xl">
            🧩
          </div>
          <h3 className="text-base font-black text-[#152238]">
            {habits.length === 0 ? 'No Habits Created Yet' : 'No Habits Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            {habits.length === 0
              ? 'Create your first anchored habit stack to begin building daily consistency.'
              : 'No habits match your active filters. Try changing or clearing the filters.'}
          </p>
          <button
            onClick={onOpenNewStack}
            className="px-6 py-2.5 rounded-2xl tactile-coral text-white text-xs font-black cursor-pointer shadow-xs"
          >
            + Create Habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredHabits.map((habit) => {
            const isPaused = habit.status === 'paused';
            const cleanAnchor = getCleanAnchorTitle(habit.anchor);
            const cleanAction = getCleanActionTitle(habit.action);
            const naturalSentence = formatHabitSentence(habit.anchor, habit.action);

            return (
              <article
                key={habit.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border flex flex-col justify-between transition-all ${
                  isPaused
                    ? 'border-dashed border-slate-300 opacity-80 bg-slate-50/50'
                    : 'border-[#F0E6DA] tactile-card hover:border-[#FF704F]/60'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Row: Category + Pause Switch */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={habit.category} size="sm" />
                      <span className="text-[11px] font-bold text-slate-500 bg-[#F5EFE6] px-2.5 py-0.5 rounded-full">
                        {habit.frequency === 'daily'
                          ? 'Daily'
                          : habit.frequency === 'weekdays'
                          ? 'Weekdays'
                          : 'Custom days'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">
                        {isPaused ? 'Paused' : 'Active'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!isPaused}
                        onClick={() => togglePauseHabit(habit.id)}
                        title={isPaused ? 'Resume habit' : 'Pause habit'}
                        className={`w-10 h-6 rounded-full relative transition-colors focus:outline-none p-0.5 cursor-pointer ${
                          !isPaused ? 'bg-[#B8E36A]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                            !isPaused ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Habit Formula: After X ➔ I will Y (No duplicates) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-sm font-black text-[#152238] flex items-center gap-2">
                      <span className="text-slate-500 font-bold">After</span>
                      <span>{cleanAnchor}</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#152238] flex items-center gap-2">
                      <span className="text-[#FF704F] font-bold">I will</span>
                      <span>{cleanAction}</span>
                    </div>
                    {/* Natural preview */}
                    <p className="text-xs text-slate-500 italic font-medium pt-0.5">
                      “{naturalSentence}”
                    </p>
                  </div>
                </div>

                {/* Bottom Control Bar */}
                <div className="mt-5 pt-3.5 border-t border-[#F0E6DA] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {habit.title}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditHabit(habit)}
                      className="px-3 py-1.5 rounded-xl hover:bg-[#FFF8F0] text-slate-600 hover:text-[#152238] text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setHabitToDelete(habit)}
                      className="px-3 py-1.5 rounded-xl hover:bg-red-50 text-red-600 text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
