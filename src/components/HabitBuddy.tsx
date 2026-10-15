import React from 'react';

interface HabitBuddyProps {
  mood?: 'happy' | 'celebrating' | 'winking' | 'waving';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const HabitBuddy: React.FC<HabitBuddyProps> = ({
  mood = 'celebrating',
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeMap[size]} ${className}`}>
      {/* Friendly MakeHabit Buddy SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md select-none transform transition-transform hover:scale-105"
      >
        {/* Ambient Glow */}
        <circle cx="50" cy="50" r="46" fill="#FFEEDB" opacity="0.6" />

        {/* Head / Body Circle with warm coral-orange to fresh lime aura */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="url(#buddyGradient)"
          stroke="#152238"
          strokeWidth="3.5"
        />

        {/* Sprout on Top (Growth metaphor) */}
        <path
          d="M50 12 C44 4, 34 8, 38 18 C42 22, 48 18, 50 14"
          fill="#B8E36A"
          stroke="#152238"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M50 14 C56 6, 66 10, 62 20 C58 24, 52 20, 50 16"
          fill="#94C843"
          stroke="#152238"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M50 13 L50 20"
          stroke="#152238"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Eyes */}
        {mood === 'winking' ? (
          <>
            {/* Winking left eye */}
            <path
              d="M34 45 Q40 50 46 45"
              fill="none"
              stroke="#152238"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Open right eye */}
            <circle cx="64" cy="45" r="5" fill="#152238" />
            <circle cx="62" cy="43" r="1.8" fill="#FFFFFF" />
          </>
        ) : (
          <>
            {/* Left Eye */}
            <circle cx="37" cy="45" r="5.5" fill="#152238" />
            <circle cx="35" cy="43" r="2" fill="#FFFFFF" />
            {/* Right Eye */}
            <circle cx="63" cy="45" r="5.5" fill="#152238" />
            <circle cx="61" cy="43" r="2" fill="#FFFFFF" />
          </>
        )}

        {/* Rosy Cheeks */}
        <ellipse cx="28" cy="54" rx="5" ry="3.5" fill="#FF704F" opacity="0.45" />
        <ellipse cx="72" cy="54" rx="5" ry="3.5" fill="#FF704F" opacity="0.45" />

        {/* Happy Smile */}
        <path
          d="M37 56 Q50 72 63 56"
          fill="#152238"
          stroke="#152238"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Tongue / Interior Smile */}
        <path
          d="M42 63 Q50 72 58 63 Z"
          fill="#FF704F"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="buddyGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF3E3" />
            <stop offset="100%" stopColor="#FFE0C2" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Sparkles when celebrating */}
      {mood === 'celebrating' && (
        <>
          <span className="absolute -top-1 -right-1 text-xs animate-bounce select-none">✨</span>
          <span className="absolute -bottom-1 -left-1 text-xs select-none flame-wiggle">🎉</span>
        </>
      )}
    </div>
  );
};
