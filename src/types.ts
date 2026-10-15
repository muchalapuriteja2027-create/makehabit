export type ViewMode = 'home' | 'habits' | 'progress' | 'settings';

export type HabitCategory = 'Health' | 'Work' | 'Personal' | 'Uncategorized';

export type HabitFrequency = 'daily' | 'weekdays' | 'custom';

export interface CategoryMeta {
  key: 'Health' | 'Work' | 'Personal';
  label: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export const HABIT_CATEGORIES: Record<'Health' | 'Work' | 'Personal', CategoryMeta> = {
  Health: {
    key: 'Health',
    label: 'Health',
    icon: 'favorite',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200/70',
    dotColor: '#10b981',
  },
  Work: {
    key: 'Work',
    label: 'Work',
    icon: 'work',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200/70',
    dotColor: '#3b82f6',
  },
  Personal: {
    key: 'Personal',
    label: 'Personal',
    icon: 'person',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200/70',
    dotColor: '#8b5cf6',
  },
};

export const UNCATEGORIZED_META = {
  key: 'Uncategorized' as const,
  label: 'Uncategorized',
  icon: 'label_off',
  badgeBg: 'bg-slate-100',
  badgeText: 'text-slate-600',
  badgeBorder: 'border-slate-200/80',
  dotColor: '#94a3b8',
};

export function getCategoryMeta(category?: string | null): CategoryMeta | null {
  if (!category || category === 'Uncategorized' || category === 'none' || category === '') {
    return null;
  }
  if (category === 'Health' || category === 'Fitness') {
    return HABIT_CATEGORIES.Health;
  }
  if (category === 'Work' || category === 'Productivity') {
    return HABIT_CATEGORIES.Work;
  }
  if (category === 'Personal' || category === 'Reading' || category === 'Learning' || category === 'Mindfulness') {
    return HABIT_CATEGORIES.Personal;
  }
  return null;
}

export function normalizeCategory(category?: string | null): HabitCategory {
  if (!category || category === 'Uncategorized' || category === 'none' || category === '') {
    return 'Uncategorized';
  }
  if (category === 'Health' || category === 'Fitness') {
    return 'Health';
  }
  if (category === 'Work' || category === 'Productivity') {
    return 'Work';
  }
  if (category === 'Personal' || category === 'Reading' || category === 'Learning' || category === 'Mindfulness') {
    return 'Personal';
  }
  return 'Uncategorized';
}

/**
 * Strips any duplicate "After" prefixes and emojis so habit cards never show "After After..."
 */
export function getCleanAnchorTitle(anchor: string): string {
  if (!anchor) return 'my routine';
  const withoutEmojis = anchor
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .trim();
  // Strip one or more repeated "After" / "after" words
  const stripped = withoutEmojis.replace(/^(after\s+)+/i, '').trim();
  return stripped || withoutEmojis || 'my routine';
}

/**
 * Strips any duplicate "I will" prefixes and emojis so habit cards never show "I will I will..."
 */
export function getCleanActionTitle(action: string): string {
  if (!action) return 'complete my habit';
  const withoutEmojis = action
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .trim();
  // Strip one or more repeated "I will" / "i will" words
  const stripped = withoutEmojis.replace(/^(i\s+will\s+)+/i, '').trim();
  return stripped || withoutEmojis || 'complete my habit';
}

/**
 * Formats a natural habit stacking sentence: "After my morning tea, I will read for 15 minutes."
 */
export function formatHabitSentence(anchor: string, action: string): string {
  const cleanAnchor = getCleanAnchorTitle(anchor);
  const cleanAction = getCleanActionTitle(action);
  return `After ${cleanAnchor}, I will ${cleanAction}.`;
}

export interface CelebrationData {
  type: 'habit' | 'all_done' | 'milestone_3' | 'milestone_7' | 'milestone_14';
  habitTitle?: string;
  anchor?: string;
  action?: string;
  streak: number;
  milestoneTitle?: string;
  milestoneBadge?: string;
  milestoneMessage?: string;
}

export interface HabitStack {
  id: string;
  userId: string;
  title: string;
  anchor: string;
  action: string;
  category?: HabitCategory | string;
  frequency: HabitFrequency;
  daysOfWeek: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  durationMinutes: number;
  scheduledTime: string; // e.g. "07:30 AM"
  status: 'active' | 'paused';
  pausedReason?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompletionRecord {
  id: string; // `${date}_${habitId}`
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
  dailyTarget: number;
  soundEffects: boolean;
}

export interface DayStreakStatus {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Mon", "Tue"
  dayShort: string; // "M", "T"
  displayDate: string; // "Nov 11"
  totalHabitsDue: number;
  completedCount: number;
  isAllCompleted: boolean;
  isToday: boolean;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletionsCount: number;
  weeklyAdherencePercent: number;
  past7Days: DayStreakStatus[];
}

export interface Milestone {
  id: string;
  title: string;
  badge: string;
  description: string;
  requiredMetric: number;
  currentProgress: number;
  isUnlocked: boolean;
}
