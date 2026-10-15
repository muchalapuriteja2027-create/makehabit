import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { HabitBuddy } from './HabitBuddy.tsx';

export const SettingsView: React.FC = () => {
  const { currentUser, userProfile, updatePreferences, signOutUser } = useAuth();

  const dailyTarget = userProfile?.dailyTarget || 3;
  const soundEffects = userProfile?.soundEffects !== false;

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
          Manage your daily target, celebratory sound and feedback, and profile.
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
                <span>{userProfile?.displayName?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-[#152238] leading-snug">
                {userProfile?.displayName || 'MakeHabit Member'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{userProfile?.email || currentUser?.email}</p>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#1E3805] mt-1 bg-[#EAF7D5] px-2.5 py-0.5 rounded-full border border-[#B8E36A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8E36A]" />
                <span>Signed In with Google</span>
              </span>
            </div>
          </div>
          <HabitBuddy mood="happy" size="sm" className="hidden sm:inline-flex" />
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

      {/* Account Actions Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F0E6DA] tactile-card flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-[#152238]">Sign Out</h2>
          <p className="text-xs text-slate-500 font-medium">
            Your habit data remains securely saved to your account.
          </p>
        </div>

        <button
          onClick={signOutUser}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black transition-colors cursor-pointer border border-red-200"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out</span>
        </button>
      </section>
    </div>
  );
};
