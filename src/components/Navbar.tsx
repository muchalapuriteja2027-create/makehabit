import React from 'react';
import { ViewMode } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useHabits } from '../context/HabitsContext.tsx';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onOpenNewStack: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenNewStack,
}) => {
  const { currentUser, userProfile, signIn } = useAuth();
  const { streakStats } = useHabits();

  const userInitial = userProfile?.displayName
    ? userProfile.displayName.charAt(0).toUpperCase()
    : currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-[#F0E6DA] sticky top-0 z-40 shadow-xs transition-all">
      <div className="max-w-[1120px] mx-auto px-4 md:px-6 flex items-center justify-between h-16 w-full">
        {/* Brand Logo & Desktop Nav */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate('home')}
            className="font-extrabold text-[22px] tracking-tight flex items-center gap-2.5 cursor-pointer focus:outline-none group"
            aria-label="MakeHabit Home"
          >
            {/* Logo Mark: Coral Orange base with Lime Sprout Spark */}
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#FF704F] text-white relative shadow-sm transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#B8E36A] ring-2 ring-white"></span>
            </span>
            <span className="flex items-center">
              <span className="text-[#152238] font-black">Make</span>
              <span className="text-[#FF704F] font-black">Habit</span>
            </span>
          </button>

          {/* Desktop Navigation Links: Home, My Habits, Progress, Settings */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => onNavigate('home')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'home'
                    ? 'bg-[#FFF1EE] text-[#FF704F]'
                    : 'text-slate-600 hover:text-[#152238] hover:bg-[#F9F4EE]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                <span>Home</span>
              </button>

              <button
                onClick={() => onNavigate('habits')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'habits'
                    ? 'bg-[#FFF1EE] text-[#FF704F]'
                    : 'text-slate-600 hover:text-[#152238] hover:bg-[#F9F4EE]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">checklist</span>
                <span>My Habits</span>
              </button>

              <button
                onClick={() => onNavigate('progress')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'progress'
                    ? 'bg-[#FFF1EE] text-[#FF704F]'
                    : 'text-slate-600 hover:text-[#152238] hover:bg-[#F9F4EE]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
                <span>Progress</span>
              </button>

              <button
                onClick={() => onNavigate('pricing')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'pricing'
                    ? 'bg-[#FFF1EE] text-[#FF704F]'
                    : 'text-slate-600 hover:text-[#152238] hover:bg-[#F9F4EE]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">sell</span>
                <span>Pricing</span>
              </button>

              <button
                onClick={() => onNavigate('settings')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'settings'
                    ? 'bg-[#FFF1EE] text-[#FF704F]'
                    : 'text-slate-600 hover:text-[#152238] hover:bg-[#F9F4EE]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span>Settings</span>
              </button>
            </nav>
          )}
        </div>

        {/* Trailing Action Cluster */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              {/* Flame Streak Badge */}
              <button
                onClick={() => onNavigate('progress')}
                title="View Streak & Progress"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-black shadow-2xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <span className="text-sm flame-wiggle">🔥</span>
                <span>{streakStats.currentStreak} Day{streakStats.currentStreak === 1 ? '' : 's'}</span>
              </button>

              {/* + Create Habit Button */}
              <button
                onClick={onOpenNewStack}
                className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl tactile-coral text-xs md:text-sm font-extrabold cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Create Habit</span>
              </button>

              {/* Profile Avatar */}
              <button
                onClick={() => onNavigate('settings')}
                title="Settings & Profile"
                className="w-9 h-9 rounded-full bg-[#FFEEDB] text-[#FF704F] font-black text-sm ring-2 ring-[#FF704F]/30 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-[#FF704F] transition-all"
              >
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName || 'Profile'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={signIn}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full tactile-coral text-xs md:text-sm font-extrabold cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#FFFFFF"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#FFFFFF"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FFFFFF"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#FFFFFF"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed for thumb reachability on mobile) */}
      {currentUser && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F0E6DA] py-1.5 px-2 shadow-lg">
          <div className="grid grid-cols-5 max-w-md mx-auto items-center">
            <button
              onClick={() => onNavigate('home')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                currentView === 'home' ? 'text-[#FF704F]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span className="text-[10px] font-bold">Home</span>
            </button>

            <button
              onClick={() => onNavigate('habits')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                currentView === 'habits' ? 'text-[#FF704F]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">checklist</span>
              <span className="text-[10px] font-bold">Habits</span>
            </button>

            <button
              onClick={() => onNavigate('progress')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                currentView === 'progress' ? 'text-[#FF704F]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
              <span className="text-[10px] font-bold">Progress</span>
            </button>

            <button
              onClick={() => onNavigate('pricing')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                currentView === 'pricing' ? 'text-[#FF704F]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">sell</span>
              <span className="text-[10px] font-bold">Pricing</span>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                currentView === 'settings' ? 'text-[#FF704F]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="text-[10px] font-bold">Settings</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
