import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { HabitsProvider } from './context/HabitsContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { MyHabitsView } from './components/MyHabitsView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { PricingView } from './components/PricingView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { LandingView } from './components/LandingView.tsx';
import { NewStackModal } from './components/NewStackModal.tsx';
import { CelebrationModal } from './components/CelebrationModal.tsx';
import { TrustModal } from './components/TrustModal.tsx';
import { ViewMode, HabitStack, TrustDocType } from './types.ts';

function MainApp() {
  const {
    currentUser,
    isGuest,
    loading,
    signIn,
    migrationSuccessMessage,
    migrationError,
    dismissMigrationNotice,
  } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [isNewStackModalOpen, setIsNewStackModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitStack | null>(null);
  const [trustModalState, setTrustModalState] = useState<{
    isOpen: boolean;
    tab: TrustDocType;
  }>({
    isOpen: false,
    tab: 'privacy',
  });

  const isAuthenticated = Boolean(currentUser || isGuest);

  const handleOpenNewStack = () => {
    setEditingHabit(null);
    setIsNewStackModalOpen(true);
  };

  const handleEditHabit = (habit: HabitStack) => {
    setEditingHabit(habit);
    setIsNewStackModalOpen(true);
  };

  const handleOpenTrustModal = (tab: TrustDocType) => {
    setTrustModalState({ isOpen: true, tab });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF8F0] p-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FF704F] text-white flex items-center justify-center shadow-md animate-pulse mb-4">
          <span
            className="material-symbols-outlined text-[32px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-[#152238] tracking-tight">MakeHabit</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Loading your daily momentum...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0] text-[#152238] selection:bg-orange-100 selection:text-orange-900">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenNewStack={handleOpenNewStack}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1120px] w-full mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Migration Success Banner */}
        {migrationSuccessMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FAFDF5] border border-[#B8E36A] flex items-start justify-between gap-3 animate-fadeIn shadow-2xs">
            <div className="flex items-start gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-[#EAF7D5] text-[#1E3805] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                ✓
              </span>
              <div className="space-y-0.5">
                <span className="text-xs font-black text-[#1E3805]">Cloud Sync Succeeded</span>
                <p className="text-xs text-slate-700 font-medium">{migrationSuccessMessage}</p>
              </div>
            </div>
            <button
              onClick={dismissMigrationNotice}
              className="text-slate-400 hover:text-slate-600 font-black text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Migration Error Banner */}
        {migrationError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start justify-between gap-3 animate-fadeIn shadow-2xs">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0 mt-0.5">warning</span>
              <div className="space-y-0.5">
                <span className="text-xs font-black">Sync Notice</span>
                <p className="text-xs font-medium">{migrationError}</p>
              </div>
            </div>
            <button
              onClick={dismissMigrationNotice}
              className="text-red-600 hover:text-red-800 font-black text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Guest Mode Warning Banner */}
        {isGuest && !currentUser && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FFF8EE] border border-[#F5DEB3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFE8CC] text-[#B85C00] flex items-center justify-center text-base font-black shrink-0">
                📱
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-[#8A4600]">Guest Mode Active</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFE8CC] text-[#8A4600] text-[10px] font-black uppercase tracking-wide">
                    Local Device Only
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Your habits and streaks are stored only on this device and will not sync across devices until you sign in.
                </p>
              </div>
            </div>
            <button
              onClick={signIn}
              className="px-4 py-2.5 rounded-xl tactile-coral text-white text-xs font-black shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign In to Sync</span>
            </button>
          </div>
        )}

        {!isAuthenticated ? (
          currentView === 'pricing' ? (
            <PricingView
              onBackToHome={() => setCurrentView('home')}
              onOpenTrustModal={handleOpenTrustModal}
            />
          ) : (
            <LandingView
              onOpenTrustModal={handleOpenTrustModal}
              onViewPricing={() => setCurrentView('pricing')}
            />
          )
        ) : (
          <>
            {currentView === 'home' && (
              <DashboardView
                onOpenNewStack={handleOpenNewStack}
                onEditHabit={handleEditHabit}
              />
            )}

            {currentView === 'habits' && (
              <MyHabitsView
                onOpenNewStack={handleOpenNewStack}
                onEditHabit={handleEditHabit}
              />
            )}

            {currentView === 'progress' && (
              <ProgressView
                onBackToHome={() => setCurrentView('home')}
                onOpenNewStack={handleOpenNewStack}
              />
            )}

            {currentView === 'pricing' && (
              <PricingView
                onBackToHome={() => setCurrentView('home')}
                onOpenTrustModal={handleOpenTrustModal}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView
                onNavigate={(view) => setCurrentView(view)}
                onOpenTrustModal={handleOpenTrustModal}
              />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <NewStackModal
        isOpen={isNewStackModalOpen}
        onClose={() => {
          setIsNewStackModalOpen(false);
          setEditingHabit(null);
        }}
        habitToEdit={editingHabit}
        onNavigateToPricing={() => setCurrentView('pricing')}
      />

      <CelebrationModal
        onBackToDashboard={() => setCurrentView('home')}
        onViewAnalytics={() => setCurrentView('progress')}
      />

      {trustModalState.isOpen && (
        <TrustModal
          isOpen={trustModalState.isOpen}
          initialTab={trustModalState.tab}
          onClose={() =>
            setTrustModalState((prev) => ({ ...prev, isOpen: false }))
          }
        />
      )}

      {/* Clean Global Consumer Footer */}
      <footer className="bg-white border-t border-[#f0e6da] py-8 mt-12 mb-16 md:mb-0">
        <div className="max-w-[1120px] mx-auto px-4 md:px-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2.5">
              <span className="font-black text-[#152238] flex items-center gap-1.5 text-sm">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF704F]"></span>
                MakeHabit
              </span>
              <span>•</span>
              <span className="font-medium">Small routines. Better habits. Real progress.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-bold text-xs">
              <button
                onClick={() => setCurrentView('home')}
                className="hover:text-[#FF704F] transition-colors cursor-pointer"
              >
                Home
              </button>
              {currentUser && (
                <>
                  <button
                    onClick={() => setCurrentView('habits')}
                    className="hover:text-[#FF704F] transition-colors cursor-pointer"
                  >
                    My Habits
                  </button>
                  <button
                    onClick={() => setCurrentView('progress')}
                    className="hover:text-[#FF704F] transition-colors cursor-pointer"
                  >
                    Progress
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentView('pricing')}
                className="hover:text-[#FF704F] transition-colors cursor-pointer text-[#FF704F]"
              >
                Pricing (₹199 Lifetime)
              </button>
              {currentUser && (
                <button
                  onClick={() => setCurrentView('settings')}
                  className="hover:text-[#FF704F] transition-colors cursor-pointer"
                >
                  Settings
                </button>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0E6DA] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 font-medium">
            <span>© {new Date().getFullYear()} MakeHabit (<a href="https://makehabit.me" className="hover:underline">makehabit.me</a>). All rights reserved.</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleOpenTrustModal('privacy')}
                className="hover:text-[#152238] transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => handleOpenTrustModal('terms')}
                className="hover:text-[#152238] transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <button
                onClick={() => handleOpenTrustModal('refund')}
                className="hover:text-[#152238] transition-colors cursor-pointer"
              >
                Refund Policy
              </button>
              <button
                onClick={() => handleOpenTrustModal('contact')}
                className="hover:text-[#152238] transition-colors cursor-pointer"
              >
                Contact & Support
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HabitsProvider>
        <MainApp />
      </HabitsProvider>
    </AuthProvider>
  );
}
