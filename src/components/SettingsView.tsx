import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ViewMode, TrustDocType } from '../types.ts';
import { HabitBuddy } from './HabitBuddy.tsx';

interface SettingsViewProps {
  onNavigate?: (view: ViewMode) => void;
  onOpenTrustModal?: (tab: TrustDocType) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onNavigate,
  onOpenTrustModal,
}) => {
  const { currentUser, userProfile, updatePreferences, signOutUser, isGuest, signIn } = useAuth();

  const dailyTarget = userProfile?.dailyTarget || 3;
  const soundEffects = userProfile?.soundEffects !== false;
  const currentPlan = userProfile?.plan === 'premium' ? 'MakeHabit Premium' : isGuest ? 'Guest Free Plan' : 'Free Plan';
  const isPremium = userProfile?.plan === 'premium';

  const handleSliderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    await updatePreferences({ dailyTarget: val });
  };

  const handleToggleSound = async () => {
    await updatePreferences({ soundEffects: !soundEffects });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-2xl mx-auto pb-16 md:pb-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1EE] text-[#FF704F] text-xs font-black mb-1">
          <span className="material-symbols-outlined text-[16px]">settings</span>
          <span>Preferences & Account</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#152238] tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
          Manage your membership plan, habit targets, legal policies, and profile.
        </p>
      </div>

      {/* Account Profile Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F0E6DA] tactile-card space-y-4">
        <h2 className="text-base font-black text-[#152238]">Your Account</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA]">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl overflow-hidden bg-[#FFEEDB] text-[#FF704F] font-black flex items-center justify-center text-xl shrink-0 shadow-2xs">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-2xl">
                  {isGuest ? 'person_outline' : 'person'}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-[#152238] leading-snug">
                {isGuest ? 'Guest Builder' : userProfile?.displayName || 'MakeHabit Member'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isGuest ? 'Stored on this device only (localStorage)' : userProfile?.email || currentUser?.email}
              </p>
              {isGuest ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-800 mt-1 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Guest Mode (Local Only)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#1E3805] mt-1 bg-[#EAF7D5] px-2.5 py-0.5 rounded-full border border-[#B8E36A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8E36A]" />
                  <span>Signed In with Google</span>
                </span>
              )}
            </div>
          </div>
          <HabitBuddy mood="happy" size="sm" className="hidden sm:inline-flex" />
        </div>

        {isGuest && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-700">cloud_off</span>
                <span>Data not synced across devices</span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium">
                Sign in with Google to automatically back up your habit stacks and streak history to Firestore without losing anything.
              </p>
            </div>
            <button
              onClick={signIn}
              className="px-4 py-2 rounded-xl bg-[#152238] hover:bg-[#1E2D4A] text-white text-xs font-black transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Sign In with Google</span>
            </button>
          </div>
        )}
      </section>

      {/* Membership Plan Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F0E6DA] tactile-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[#152238]">Membership Plan</h2>
            <p className="text-xs text-slate-500 font-medium">Your current tier and available habit allocations.</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black ${
            isPremium
              ? 'bg-[#EAF7D5] border border-[#B8E36A] text-[#1E3805]'
              : 'bg-[#FFF1EE] text-[#FF704F] border border-[#FF704F]/30'
          }`}>
            {currentPlan}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-black text-[#152238] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#FF704F]">
                {isPremium ? 'verified' : 'inventory_2'}
              </span>
              <span>{isPremium ? 'Premium Lifetime Access' : 'Free Starter Plan'}</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {isPremium
                ? 'Unlimited active habits, 90-day retention reports, and consistency heatmaps.'
                : 'Up to 3 active habit stacks with daily check-ins and weekly streak tracking.'}
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('pricing')}
              className="px-5 py-2.5 rounded-2xl tactile-coral text-white text-xs font-black shrink-0 whitespace-nowrap cursor-pointer shadow-xs"
            >
              {isPremium ? 'View Plan Details' : 'Upgrade — ₹199'}
            </button>
          )}
        </div>
      </section>

      {/* Habit Preferences Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F0E6DA] tactile-card space-y-5">
        <div>
          <h2 className="text-base font-black text-[#152238]">Habit Preferences</h2>
          <p className="text-xs text-slate-500 font-medium">Tune your target daily cadence and celebratory feedback.</p>
        </div>

        {/* Daily Goal Target Slider */}
        <div className="p-4 bg-[#FFF8F0] rounded-2xl border border-[#F0E6DA] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="settings-daily-target" className="text-sm font-black text-[#152238] block">
                Daily Habits Goal
              </label>
              <span className="text-xs text-slate-500 font-medium">
                Target completed routines you aim for each day
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#EAF7D5] text-[#1E3805] font-black flex items-center justify-center text-lg border border-[#B8E36A] shadow-2xs">
              {dailyTarget}
            </div>
          </div>
          <input
            id="settings-daily-target"
            type="range"
            min="1"
            max="8"
            value={dailyTarget}
            onChange={handleSliderChange}
            className="w-full accent-[#FF704F] h-2 bg-[#F0E6DA] rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs font-black text-slate-400">
            <span>1 habit/day</span>
            <span className="text-[#FF704F]">{dailyTarget} per day</span>
            <span>8 habits/day</span>
          </div>
        </div>

        {/* Audio & Celebration Feedback Switch */}
        <div className="p-4 bg-[#FFF8F0] rounded-2xl border border-[#F0E6DA] flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#FFEEDB] rounded-2xl text-[#FF704F] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">celebration</span>
            </div>
            <div>
              <span className="text-sm font-black text-[#152238] block">
                Sound & Confetti Celebration
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Play an encouraging audio chime and small confetti burst on completion
              </span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={soundEffects}
            onClick={handleToggleSound}
            className={`w-12 h-7 rounded-full relative transition-colors focus:outline-none p-0.5 cursor-pointer shrink-0 ${
              soundEffects ? 'bg-[#B8E36A]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                soundEffects ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Trust, Legal & Support Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F0E6DA] tactile-card space-y-4">
        <div>
          <h2 className="text-base font-black text-[#152238]">Trust & Policies</h2>
          <p className="text-xs text-slate-500 font-medium">
            Learn about your data privacy, terms, upcoming refund policy, and support channels.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onOpenTrustModal?.('privacy')}
            className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] hover:border-[#FF704F]/50 text-left transition-colors cursor-pointer space-y-1"
          >
            <span className="material-symbols-outlined text-[18px] text-[#1E3805]">lock</span>
            <div className="text-xs font-black text-[#152238]">Privacy Policy</div>
            <p className="text-[10px] text-slate-500 font-medium">Your data stays yours</p>
          </button>

          <button
            onClick={() => onOpenTrustModal?.('terms')}
            className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] hover:border-[#FF704F]/50 text-left transition-colors cursor-pointer space-y-1"
          >
            <span className="material-symbols-outlined text-[18px] text-blue-600">gavel</span>
            <div className="text-xs font-black text-[#152238]">Terms of Service</div>
            <p className="text-[10px] text-slate-500 font-medium">Fair usage guidelines</p>
          </button>

          <button
            onClick={() => onOpenTrustModal?.('refund')}
            className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] hover:border-[#FF704F]/50 text-left transition-colors cursor-pointer space-y-1"
          >
            <span className="material-symbols-outlined text-[18px] text-[#FF704F]">currency_rupee</span>
            <div className="text-xs font-black text-[#152238]">Refund Policy</div>
            <p className="text-[10px] text-slate-500 font-medium">Policy details</p>
          </button>

          <button
            onClick={() => onOpenTrustModal?.('contact')}
            className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] hover:border-[#FF704F]/50 text-left transition-colors cursor-pointer space-y-1"
          >
            <span className="material-symbols-outlined text-[18px] text-purple-600">support_agent</span>
            <div className="text-xs font-black text-[#152238]">Contact Support</div>
            <p className="text-[10px] text-slate-500 font-medium">Support details coming soon</p>
          </button>
        </div>
      </section>

      {/* Account Actions Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F0E6DA] tactile-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-[#152238]">
            {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isGuest
              ? 'Your local habits remain on this device. Sign in with Google anytime to back them up to the cloud.'
              : 'Your habit data remains securely saved to your account in Firestore.'}
          </p>
        </div>

        <button
          onClick={signOutUser}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black transition-colors cursor-pointer border border-red-200 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>{isGuest ? 'Exit Guest Mode' : 'Sign Out'}</span>
        </button>
      </section>
    </div>
  );
};
