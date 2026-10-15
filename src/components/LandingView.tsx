import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { CategoryBadge } from './CategoryBadge.tsx';
import { HabitBuddy } from './HabitBuddy.tsx';

export const LandingView: React.FC = () => {
  const { signIn, loading } = useAuth();
  const [heroHabitDone, setHeroHabitDone] = useState(false);
  const [activeRoutineTab, setActiveRoutineTab] = useState<'morning' | 'evening'>('morning');
  const [sandboxChecks, setSandboxChecks] = useState<Record<string, boolean>>({
    m1: true,
    m2: false,
    m3: false,
    e1: false,
    e2: false,
    e3: false,
  });

  const toggleSandbox = (id: string) => {
    setSandboxChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-16 animate-fadeIn pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 md:pt-14 md:pb-18 text-center">
        {/* Ambient Backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#FFEEDB]/50 blur-[100px] pointer-events-none rounded-full -z-10"></div>
        <div className="absolute top-1/3 left-1/4 w-[340px] h-[340px] bg-[#EAF7D5]/40 blur-[80px] pointer-events-none rounded-full -z-10"></div>

        <div className="max-w-[1120px] mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF1EE] text-[#FF704F] text-xs font-black border border-[#F0E6DA] shadow-2xs">
              <span className="material-symbols-outlined text-[16px]">link</span>
              <span>Small routines. Better habits. Real progress.</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#152238] tracking-tight leading-tight">
              Turn everyday routines into lasting habits.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              MakeHabit uses habit stacking to attach new positive actions to things you already do
              every single day. Build unbroken streaks, celebrate milestones, and make personal growth
              feel fun and rewarding.
            </p>

            {/* Main CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={signIn}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl tactile-coral text-white text-sm font-black flex items-center justify-center gap-3 cursor-pointer shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <a
                href="#interactive-demo"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-[#FFF8F0] text-[#152238] border border-[#F0E6DA] text-sm font-black flex items-center justify-center gap-2 shadow-2xs transition-colors"
              >
                <span>Try Interactive Demo</span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  arrow_downward
                </span>
              </a>
            </div>
          </div>

          {/* Interactive Stack Demonstration Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0E6DA] shadow-xl relative text-left tactile-card">
              <div className="flex items-center justify-between pb-4 border-b border-[#F0E6DA] mb-6">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#B8E36A]"></span>
                  <span className="text-xs font-black text-[#152238] uppercase tracking-wide">
                    The Habit Stacking Formula
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] border border-amber-200 text-amber-900 text-xs font-black">
                  <span className="text-sm flame-wiggle">🔥</span>
                  <span>7 Day Streak</span>
                </div>
              </div>

              {/* Habit Flow */}
              <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 md:gap-2">
                {/* Step 1: Anchor */}
                <div className="md:col-span-5 bg-[#FFF8F0] rounded-2xl p-5 border border-[#F0E6DA]">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-xs text-[#FF704F] font-black flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">anchor</span>
                        <span>STEP 1: ANCHOR</span>
                      </span>
                      <h3 className="text-base font-black text-[#152238] pt-1">
                        ☕ After my morning tea
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Automatic daily routine at 7:30 AM</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#B8E36A] text-[#1E3805] flex items-center justify-center shadow-xs font-black">
                      ✓
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#F0E6DA] flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Existing daily habit</span>
                    <span className="text-[#1E3805] font-bold">100% Consistent</span>
                  </div>
                </div>

                {/* Connector */}
                <div className="md:col-span-1 flex flex-col md:flex-row items-center justify-center py-2">
                  <div className="flex md:flex-col items-center justify-center gap-1 text-[#FF704F]">
                    <div className="w-8 md:w-0.5 h-0.5 md:h-8 bg-[#F0E6DA] rounded-full"></div>
                    <div className="w-8 h-8 rounded-full bg-[#FFF1EE] text-[#FF704F] flex items-center justify-center shadow-2xs font-black">
                      <span className="material-symbols-outlined text-[16px]">link</span>
                    </div>
                    <div className="w-8 md:w-0.5 h-0.5 md:h-8 bg-[#F0E6DA] rounded-full"></div>
                  </div>
                </div>

                {/* Step 2: New Habit */}
                <div className={`md:col-span-5 rounded-2xl p-5 border-2 transition-all ${
                  heroHabitDone
                    ? 'border-[#B8E36A] bg-[#FAFDF5]'
                    : 'border-[#F0E6DA] bg-white'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-xs text-[#1E3805] font-black flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">layers</span>
                        <span>STEP 2: NEW HABIT</span>
                      </span>
                      <h3 className={`text-base font-black pt-1 ${
                        heroHabitDone ? 'line-through text-slate-400' : 'text-[#152238]'
                      }`}>
                        📚 I will read for 15 minutes
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Focused reading right after tea</p>
                    </div>

                    <button
                      onClick={() => setHeroHabitDone(!heroHabitDone)}
                      title="Tap to test tactile completion"
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                        heroHabitDone
                          ? 'tactile-lime font-black'
                          : 'border-2 border-slate-300 bg-white text-transparent hover:border-[#FF704F]'
                      }`}
                    >
                      {heroHabitDone ? '✓' : ''}
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F0E6DA] flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 font-bold ${
                        heroHabitDone ? 'text-[#1E3805]' : 'text-slate-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {heroHabitDone ? 'verified' : 'touch_app'}
                      </span>
                      <span>{heroHabitDone ? 'Completed! (Tap to undo)' : 'Click checkmark to test'}</span>
                    </span>
                    <span className="text-amber-800 font-bold">Streak Extended 🔥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Principles of Habit Stacking */}
      <section className="py-8 max-w-[1120px] mx-auto px-4 md:px-6">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-black text-[#FF704F] tracking-wider uppercase">
            WHY HABIT STACKING WORKS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#152238]">
            Build habits without willpower fatigue
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Instead of forcing motivation, harness the neural pathways you already use every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F0E6DA] tactile-card space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1EE] text-[#FF704F] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">anchor</span>
            </div>
            <h3 className="text-base font-black text-[#152238]">1. Anchor to an ingrained habit</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Pair your new routine with something you never skip—like your morning tea, brushing teeth,
              or shutting down your work laptop.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F0E6DA] tactile-card space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7D5] text-[#1E3805] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">bolt</span>
            </div>
            <h3 className="text-base font-black text-[#152238]">2. Keep friction low</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Start with a micro-action (5 to 15 minutes) so that showing up feels effortless and
              naturally consistent.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F0E6DA] tactile-card space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-amber-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">military_tech</span>
            </div>
            <h3 className="text-base font-black text-[#152238]">3. Celebrate every win</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Satisfying tactile feedback, compounding streaks, and milestones make consistency
              playful and rewarding.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox: Live Stack Tester */}
      <section className="bg-white/60 border-y border-[#F0E6DA] py-12" id="interactive-demo">
        <div className="max-w-[1120px] mx-auto px-4 md:px-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0E6DA] shadow-md tactile-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F0E6DA]">
              <div>
                <span className="text-xs font-black text-[#FF704F]">INTERACTIVE DEMO</span>
                <h3 className="text-xl font-black text-[#152238]">Try checking off a stack</h3>
                <p className="text-xs text-slate-500 font-medium">Click the checkmarks to experience tactile feedback</p>
              </div>

              {/* Routine Tab Switcher */}
              <div className="flex items-center gap-1 p-1 bg-[#F5EFE6] rounded-2xl self-start sm:self-auto">
                <button
                  onClick={() => setActiveRoutineTab('morning')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeRoutineTab === 'morning'
                      ? 'bg-white text-[#152238] shadow-xs'
                      : 'text-slate-600 hover:text-[#152238]'
                  }`}
                >
                  Morning Routine
                </button>
                <button
                  onClick={() => setActiveRoutineTab('evening')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeRoutineTab === 'evening'
                      ? 'bg-white text-[#152238] shadow-xs'
                      : 'text-slate-600 hover:text-[#152238]'
                  }`}
                >
                  Evening Wind-down
                </button>
              </div>
            </div>

            {/* Sandbox Items */}
            <div className="mt-6 space-y-3">
              {activeRoutineTab === 'morning' ? (
                <>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] transition-all">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSandbox('m1')}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          sandboxChecks.m1
                            ? 'bg-[#B8E36A] text-[#1E3805] font-black shadow-xs pop-check'
                            : 'border-2 border-slate-300 bg-white'
                        }`}
                      >
                        {sandboxChecks.m1 && '✓'}
                      </button>
                      <div>
                        <h4 className="text-sm font-black text-[#152238]">1. Drink 500ml of water</h4>
                        <p className="text-xs text-slate-500 font-medium">Trigger: Stepping out of bed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category="Health" size="sm" />
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F5EFE6] text-slate-600 text-xs font-bold">
                        2 min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] transition-all">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSandbox('m2')}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          sandboxChecks.m2
                            ? 'bg-[#B8E36A] text-[#1E3805] font-black shadow-xs pop-check'
                            : 'border-2 border-slate-300 bg-white'
                        }`}
                      >
                        {sandboxChecks.m2 && '✓'}
                      </button>
                      <div>
                        <h4 className="text-sm font-black text-[#152238]">2. 5-minute sun exposure</h4>
                        <p className="text-xs text-slate-500 font-medium">Trigger: Right after drinking water</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category="Health" size="sm" />
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F5EFE6] text-slate-600 text-xs font-bold">
                        5 min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] transition-all">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSandbox('m3')}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          sandboxChecks.m3
                            ? 'bg-[#B8E36A] text-[#1E3805] font-black shadow-xs pop-check'
                            : 'border-2 border-slate-300 bg-white'
                        }`}
                      >
                        {sandboxChecks.m3 && '✓'}
                      </button>
                      <div>
                        <h4 className="text-sm font-black text-[#152238]">3. Write top 3 priorities</h4>
                        <p className="text-xs text-slate-500 font-medium">Trigger: Sitting at work desk</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category="Work" size="sm" />
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F5EFE6] text-slate-600 text-xs font-bold">
                        3 min
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] transition-all">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSandbox('e1')}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          sandboxChecks.e1
                            ? 'bg-[#B8E36A] text-[#1E3805] font-black shadow-xs pop-check'
                            : 'border-2 border-slate-300 bg-white'
                        }`}
                      >
                        {sandboxChecks.e1 && '✓'}
                      </button>
                      <div>
                        <h4 className="text-sm font-black text-[#152238]">1. Put phone on charger across room</h4>
                        <p className="text-xs text-slate-500 font-medium">Trigger: Finishing dinner dishes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category="Personal" size="sm" />
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F5EFE6] text-slate-600 text-xs font-bold">
                        1 min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] transition-all">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSandbox('e2')}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          sandboxChecks.e2
                            ? 'bg-[#B8E36A] text-[#1E3805] font-black shadow-xs pop-check'
                            : 'border-2 border-slate-300 bg-white'
                        }`}
                      >
                        {sandboxChecks.e2 && '✓'}
                      </button>
                      <div>
                        <h4 className="text-sm font-black text-[#152238]">2. 10-minute restorative stretch</h4>
                        <p className="text-xs text-slate-500 font-medium">Trigger: Phone docked away</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category="Health" size="sm" />
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F5EFE6] text-slate-600 text-xs font-bold">
                        10 min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] transition-all">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSandbox('e3')}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          sandboxChecks.e3
                            ? 'bg-[#B8E36A] text-[#1E3805] font-black shadow-xs pop-check'
                            : 'border-2 border-slate-300 bg-white'
                        }`}
                      >
                        {sandboxChecks.e3 && '✓'}
                      </button>
                      <div>
                        <h4 className="text-sm font-black text-[#152238]">3. Read 5 pages in bed</h4>
                        <p className="text-xs text-slate-500 font-medium">Trigger: Dimming bedside lamp</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category="Personal" size="sm" />
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F5EFE6] text-slate-600 text-xs font-bold">
                        15 min
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAFDF5] border border-[#B8E36A]">
              <div className="flex items-center gap-3">
                <HabitBuddy mood="celebrating" size="sm" />
                <p className="text-xs sm:text-sm text-[#152238] font-black">
                  Ready to craft your own anchored habits?
                </p>
              </div>
              <button
                onClick={signIn}
                className="px-6 py-2.5 rounded-2xl tactile-coral text-white text-xs font-black shadow-xs cursor-pointer whitespace-nowrap"
              >
                Sign In with Google
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-[1120px] mx-auto px-4 md:px-6">
        <div className="bg-gradient-to-br from-[#FF704F] to-[#E55737] rounded-3xl p-8 md:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Start your first habit stack today.
            </h2>
            <p className="text-xs sm:text-base text-white/90 max-w-lg mx-auto font-medium">
              Small routines. Better habits. Real progress. Build lifelong momentum.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={signIn}
                disabled={loading}
                className="px-8 py-3.5 rounded-2xl bg-white text-[#FF704F] hover:bg-[#FFF8F0] text-sm font-black shadow-lg transition-transform active:translate-y-0.5 cursor-pointer"
              >
                Get Started with Google
              </button>
            </div>
            <p className="text-[11px] text-white/80 font-medium">Private, secure Google Sign-In with real-time cloud sync</p>
          </div>
        </div>
      </section>
    </div>
  );
};
