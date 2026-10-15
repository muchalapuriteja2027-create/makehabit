import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { HabitsProvider } from './context/HabitsContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { MyHabitsView } from './components/MyHabitsView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { LandingView } from './components/LandingView.tsx';
import { NewStackModal } from './components/NewStackModal.tsx';
import { CelebrationModal } from './components/CelebrationModal.tsx';
import { ViewMode, HabitStack } from './types.ts';

function MainApp() {
  const { currentUser, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [isNewStackModalOpen, setIsNewStackModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitStack | null>(null);

  const handleOpenNewStack = () => {
    setEditingHabit(null);
    setIsNewStackModalOpen(true);
  };

  const handleEditHabit = (habit: HabitStack) => {
    setEditingHabit(habit);
    setIsNewStackModalOpen(true);
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
          <LandingView />
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

            {currentView === 'settings' && <SettingsView />}
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
      />

      <CelebrationModal
        onBackToDashboard={() => setCurrentView('home')}
        onViewAnalytics={() => setCurrentView('progress')}
      />

      {/* Clean Global Consumer Footer */}
      <footer className="bg-white border-t border-[#f0e6da] py-6 mt-12 mb-16 md:mb-0">
        <div className="max-w-[1120px] mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-[#152238] flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF704F]"></span>
              MakeHabit
            </span>
            <span>•</span>
            <span>Small routines. Better habits. Real progress.</span>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <button
              onClick={() => setCurrentView('home')}
              className="hover:text-[#FF704F] transition-colors cursor-pointer"
            >
              Home
            </button>
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
            <button
              onClick={() => setCurrentView('settings')}
              className="hover:text-[#FF704F] transition-colors cursor-pointer"
            >
              Settings
            </button>
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
