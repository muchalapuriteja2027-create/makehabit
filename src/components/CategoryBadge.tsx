import React from 'react';
import { getCategoryMeta, UNCATEGORIZED_META } from '../types.ts';

interface CategoryBadgeProps {
  category?: string | null;
  size?: 'sm' | 'md';
  showUncategorized?: boolean;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'sm',
  showUncategorized = true,
  className = '',
}) => {
  const meta = getCategoryMeta(category);

  if (!meta) {
    if (!showUncategorized) return null;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-colors ${
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${UNCATEGORIZED_META.badgeBg} ${UNCATEGORIZED_META.badgeText} border ${
          UNCATEGORIZED_META.badgeBorder
        } ${className}`}
        title="Uncategorized habit"
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: UNCATEGORIZED_META.dotColor }}
        />
        <span className="material-symbols-outlined text-[13px] leading-none opacity-70">
          {UNCATEGORIZED_META.icon}
        </span>
        <span className="leading-tight">{UNCATEGORIZED_META.label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-colors ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      } ${meta.badgeBg} ${meta.badgeText} border ${meta.badgeBorder} ${className}`}
      title={`${meta.label} category`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
        style={{ backgroundColor: meta.dotColor }}
      />
      <span className="material-symbols-outlined text-[13px] leading-none">
        {meta.icon}
      </span>
      <span className="leading-tight">{meta.label}</span>
    </span>
  );
};
