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
  const { currentUser, loading } = useAuth();
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
        {!currentUser ? (
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
