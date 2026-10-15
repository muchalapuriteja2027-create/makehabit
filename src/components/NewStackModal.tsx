import React, { useState, useEffect } from 'react';
import { useHabits } from '../context/HabitsContext.tsx';
import {
  HabitStack,
  HabitCategory,
  HabitFrequency,
  normalizeCategory,
  getCleanAnchorTitle,
  getCleanActionTitle,
  formatHabitSentence,
} from '../types.ts';
import { CategoryBadge } from './CategoryBadge.tsx';

interface NewStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: HabitStack | null;
}

const POPULAR_ANCHORS = [
  'pouring my morning tea ☕',
  'stepping out of bed 🛏️',
  'finishing lunch 🥗',
  'closing my work laptop 💻',
  'brushing teeth at night 🪥',
];

const RECOMMENDED_STARTERS = [
  'read for 15 minutes 📚',
  'drink a tall glass of water 💧',
  'do 10 pushups 💪',
  'stretch for 10 minutes 🧘',
  'walk outside for 15 minutes 🌿',
  'write 3 lines in journal ✍️',
];

export const NewStackModal: React.FC<NewStackModalProps> = ({
  isOpen,
  onClose,
  habitToEdit,
}) => {
  const { addHabit, updateHabit } = useHabits();

  const [anchor, setAnchor] = useState('my morning tea ☕');
  const [action, setAction] = useState('read for 15 minutes 📚');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Personal');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (habitToEdit) {
      setAnchor(getCleanAnchorTitle(habitToEdit.anchor));
      setAction(getCleanActionTitle(habitToEdit.action));
      setTitle(habitToEdit.title);
      setCategory(normalizeCategory(habitToEdit.category));
      setFrequency(habitToEdit.frequency || 'daily');
      setDaysOfWeek(habitToEdit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
    } else {
      setAnchor('my morning tea ☕');
      setAction('read for 15 minutes 📚');
      setTitle('');
      setCategory('Personal');
      setFrequency('daily');
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFrequencyChange = (freq: HabitFrequency) => {
    setFrequency(freq);
    if (freq === 'daily') {
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    } else if (freq === 'weekdays') {
      setDaysOfWeek([1, 2, 3, 4, 5]);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setFrequency('custom');
    if (daysOfWeek.includes(dayIndex)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter((d) => d !== dayIndex));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, dayIndex].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAnchor = getCleanAnchorTitle(anchor);
    const cleanAction = getCleanActionTitle(action);

    if (!cleanAnchor.trim() || !cleanAction.trim()) {
      setErrorMsg('Please specify both an existing routine and your new habit.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const generatedTitle =
      title.trim() ||
      `${cleanAction.charAt(0).toUpperCase() + cleanAction.slice(1)} Routine`;

    try {
      if (habitToEdit) {
        await updateHabit(habitToEdit.id, {
          title: generatedTitle,
          anchor: cleanAnchor,
          action: cleanAction,
          category,
          frequency,
          daysOfWeek,
          durationMinutes: 15,
          scheduledTime: '08:00 AM',
        });
      } else {
        await addHabit({
          title: generatedTitle,
          anchor: cleanAnchor,
          action: cleanAction,
          category,
          frequency,
          daysOfWeek,
          durationMinutes: 15,
          scheduledTime: '08:00 AM',
          status: 'active',
        });
      }
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const livePreviewSentence = formatHabitSentence(anchor, action);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#152238]/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-white rounded-3xl max-w-[600px] w-full p-6 sm:p-8 shadow-2xl border border-[#F0E6DA] my-8 space-y-6 tactile-card-modal">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1EE] text-[#FF704F] text-xs font-black">
              <span className="material-symbols-outlined text-[16px]">link</span>
              <span>Habit Stacking</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#152238] tracking-tight">
              {habitToEdit ? 'Edit Habit Stack' : 'Create a Habit Stack'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Attach what you <span className="text-[#FF704F] font-bold">want to do</span> to what you <span className="text-[#152238] font-bold">already do</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-[#152238] hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1: Existing Routine (Anchor) */}
          <div className="space-y-2">
            <label htmlFor="anchor-input" className="text-sm font-black text-[#152238] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FFEEDB] text-[#FF704F] text-xs font-black flex items-center justify-center">
                1
              </span>
              <span>After I… <span className="text-slate-400 font-medium text-xs">(Existing Routine)</span></span>
            </label>
            <input
              id="anchor-input"
              type="text"
              required
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
              placeholder="e.g. pour my morning tea, shut down my laptop..."
              className="w-full bg-[#FFF8F0] rounded-2xl border border-[#F0E6DA] px-4 py-3 text-sm text-[#152238] font-semibold focus:bg-white focus:border-[#FF704F] focus:ring-2 focus:ring-[#FF704F]/20 transition-all outline-none"
            />
            {/* Quick Anchor Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_ANCHORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAnchor(item)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    anchor === item
                      ? 'bg-[#FFF1EE] text-[#FF704F] border border-[#FF704F]/50'
                      : 'bg-[#F5EFE6] text-slate-600 hover:bg-[#EBE2D5]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Target Habit Action */}
          <div className="space-y-2">
            <label htmlFor="action-input" className="text-sm font-black text-[#152238] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EAF7D5] text-[#1E3805] text-xs font-black flex items-center justify-center">
                2
              </span>
              <span>I will… <span className="text-slate-400 font-medium text-xs">(New Habit)</span></span>
            </label>
            <input
              id="action-input"
              type="text"
              required
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. read for 15 minutes, drink a glass of water..."
              className="w-full bg-[#FFF8F0] rounded-2xl border border-[#F0E6DA] px-4 py-3 text-sm text-[#152238] font-semibold focus:bg-white focus:border-[#FF704F] focus:ring-2 focus:ring-[#FF704F]/20 transition-all outline-none"
            />
            {/* Quick Starters */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {RECOMMENDED_STARTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAction(item)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    action === item
                      ? 'bg-[#EAF7D5] text-[#1E3805] border border-[#B8E36A]'
                      : 'bg-[#F5EFE6] text-slate-600 hover:bg-[#EBE2D5]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Category Selector */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#152238] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-500">category</span>
                <span>Category (Optional)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {category === 'Uncategorized' ? 'None selected' : `${category} category`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCategory('Health')}
                className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                  category === 'Health'
                    ? 'bg-[#EAF7D5] border-[#B8E36A] text-[#1E3805] shadow-xs ring-2 ring-[#B8E36A]/50'
                    : 'bg-white border-[#F0E6DA] text-slate-600 hover:bg-[#FFF8F0]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#B8E36A] shrink-0" />
                <span className="material-symbols-outlined text-[16px] text-[#3B5E0D]">favorite</span>
                <span>Health</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('Work')}
                className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                  category === 'Work'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs ring-2 ring-blue-400/30'
                    : 'bg-white border-[#F0E6DA] text-slate-600 hover:bg-[#FFF8F0]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#3B82F6] shrink-0" />
                <span className="material-symbols-outlined text-[16px] text-blue-600">work</span>
                <span>Work</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('Personal')}
                className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                  category === 'Personal'
                    ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs ring-2 ring-purple-400/30'
                    : 'bg-white border-[#F0E6DA] text-slate-600 hover:bg-[#FFF8F0]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6] shrink-0" />
                <span className="material-symbols-outlined text-[16px] text-purple-600">person</span>
                <span>Personal</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('Uncategorized')}
                className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                  category === 'Uncategorized'
                    ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs ring-2 ring-slate-400/30'
                    : 'bg-white border-[#F0E6DA] text-slate-500 hover:bg-[#FFF8F0]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span className="material-symbols-outlined text-[16px] text-slate-500">label_off</span>
                <span>None</span>
              </button>
            </div>
          </div>

          {/* Repeat Frequency */}
          <div className="space-y-2 pt-1 border-t border-[#F0E6DA]">
            <label className="text-xs font-black text-[#152238] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-slate-500">
                event_repeat
              </span>
              <span>Repeat Frequency</span>
            </label>
            <div className="p-1 rounded-2xl bg-[#F5EFE6] flex gap-1">
              <button
                type="button"
                onClick={() => handleFrequencyChange('daily')}
                className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  frequency === 'daily'
                    ? 'bg-white text-[#152238] shadow-xs'
                    : 'text-slate-600 hover:text-[#152238]'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => handleFrequencyChange('weekdays')}
                className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  frequency === 'weekdays'
                    ? 'bg-white text-[#152238] shadow-xs'
                    : 'text-slate-600 hover:text-[#152238]'
                }`}
              >
                Weekdays (Mon-Fri)
              </button>
            </div>

            {/* Day Pills */}
            <div className="flex items-center justify-between pt-1">
              {dayLabels.map((lbl, idx) => {
                const isActive = daysOfWeek.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`w-8 h-8 rounded-full text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#B8E36A] text-[#1E3805] shadow-2xs scale-105'
                        : 'bg-[#F5EFE6] text-slate-400 hover:bg-[#EBE2D5]'
                    }`}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Card — Naturally Phrased */}
          <div className="bg-[#FFF8F0] rounded-2xl p-4 border border-[#F0E6DA] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                Final Habit Sentence Preview
              </span>
              <CategoryBadge category={category} size="sm" />
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-[#F0E6DA] text-[#152238] text-sm leading-relaxed font-bold shadow-2xs">
              “{livePreviewSentence}”
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 rounded-2xl tactile-coral text-xs sm:text-sm font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>
                {isSubmitting
                  ? 'Saving…'
                  : habitToEdit
                  ? 'Save Changes'
                  : 'Create Habit'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
