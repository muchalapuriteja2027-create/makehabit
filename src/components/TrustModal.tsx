import React, { useState } from 'react';
import { TrustDocType } from '../types.ts';
import { HabitBuddy } from './HabitBuddy.tsx';

interface TrustModalProps {
  isOpen: boolean;
  initialTab?: TrustDocType;
  onClose: () => void;
}

export const TrustModal: React.FC<TrustModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TrustDocType>(initialTab);
  // Sync initial tab when opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#152238]/70 backdrop-blur-xs overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trust-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-[700px] w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col shadow-2xl border border-[#F0E6DA] tactile-card-modal overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="shrink-0 bg-white border-b border-[#F0E6DA] px-6 py-4.5 sm:px-8 sm:py-5 flex items-start justify-between z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7D5] text-[#1E3805] text-xs font-black">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Trust & Transparency</span>
            </div>
            <h2 id="trust-modal-title" className="text-xl sm:text-2xl font-black text-[#152238] tracking-tight">
              MakeHabit Legal & Support
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Clear policies, user data privacy, and direct contact.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full text-slate-400 hover:text-[#152238] hover:bg-[#F5EFE6] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="shrink-0 px-6 sm:px-8 pt-3 bg-white border-b border-[#F0E6DA]">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-3">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'bg-[#152238] text-white shadow-xs'
                  : 'bg-[#FFF8F0] text-slate-600 hover:text-[#152238] hover:bg-[#F5EFE6]'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'terms'
                  ? 'bg-[#152238] text-white shadow-xs'
                  : 'bg-[#FFF8F0] text-slate-600 hover:text-[#152238] hover:bg-[#F5EFE6]'
              }`}
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveTab('refund')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'refund'
                  ? 'bg-[#152238] text-white shadow-xs'
                  : 'bg-[#FFF8F0] text-slate-600 hover:text-[#152238] hover:bg-[#F5EFE6]'
              }`}
            >
              Refund Policy
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'contact'
                  ? 'bg-[#152238] text-white shadow-xs'
                  : 'bg-[#FFF8F0] text-slate-600 hover:text-[#152238] hover:bg-[#F5EFE6]'
              }`}
            >
              Contact & Support
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6 space-y-4 scrollbar-thin text-slate-700 leading-relaxed text-xs sm:text-sm">
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#1E3805] font-black text-sm">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Privacy Policy · Last Updated: October 2026</span>
              </div>
              <p>
                At <strong>MakeHabit</strong> (hosted at <a href="https://makehabit.me" className="text-[#FF704F] underline font-semibold">makehabit.me</a>), we believe your personal routines and daily self-improvement should remain private and secure.
              </p>

              <h3 className="text-base font-black text-[#152238] pt-2">1. Data We Collect</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Account Information:</strong> When you sign in with Google, we receive your basic profile name, email address, and profile photo for authentication and avatar display.</li>
                <li><strong>Habit Stacks & Records:</strong> The anchors (existing triggers), new actions, categories, frequency schedules, and daily completion timestamps you create.</li>
                <li><strong>Preferences:</strong> Your selected daily goal target and sound effect preferences.</li>
              </ul>

              <h3 className="text-base font-black text-[#152238] pt-2">2. How Your Data Is Stored & Used</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Your data is stored in Google Cloud Firestore with granular, per-user security rules ensuring <strong>only you</strong> can read or update your own records.</li>
                <li>We do not sell, rent, monetize, or share your personal data with third-party advertising networks or data brokers.</li>
                <li>We use client-side authentication to sync your habits across your desktop and mobile browsers.</li>
                <li>When enabled, Microsoft Clarity may collect pseudonymous usage analytics, heatmaps, and session recordings so we can improve the user experience. Microsoft says Clarity masks sensitive content by default, but users should still avoid entering sensitive personal or health information into habit names or descriptions.</li>
              </ul>

              <h3 className="text-base font-black text-[#152238] pt-2">3. Data Retention & Deletion</h3>
              <p>
                You have full control over your habits. You can edit, pause, or permanently delete any habit stack at any time directly in the app. For account deletion or privacy inquiries, support details coming soon.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#152238] font-black text-sm">
                <span className="material-symbols-outlined text-[18px]">description</span>
                <span>Terms of Service · Last Updated: October 2026</span>
              </div>
              <p>
                By accessing or using <strong>MakeHabit</strong> (<a href="https://makehabit.me" className="text-[#FF704F] underline font-semibold">makehabit.me</a>), you agree to these Terms of Service.
              </p>

              <h3 className="text-base font-black text-[#152238] pt-2">1. The Service</h3>
              <p>
                MakeHabit provides a behavioral habit stacking platform designed to help users establish consistent daily habits through anchor-action associations, streak tracking, and consistency analytics.
              </p>

              <h3 className="text-base font-black text-[#152238] pt-2">2. User Accounts & Fair Use</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>You are responsible for maintaining the security of your Google account login.</li>
                <li>The Free tier accommodates up to 3 active habit stacks with daily check-ins and weekly streak tracking.</li>
                <li>MakeHabit Premium is planned as a proposed one-time upgrade; payments are not available yet.</li>
                <li>You agree not to attempt to disrupt the service, reverse engineer, or abuse API endpoints.</li>
              </ul>

              <h3 className="text-base font-black text-[#152238] pt-2">3. Disclaimer & Warranties</h3>
              <p>
                MakeHabit is a self-improvement productivity tool provided on an "as is" and "as available" basis. While we strive for high uptime and accurate data sync, we do not guarantee uninterrupted availability.
              </p>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#FF704F] font-black text-sm">
                <span className="material-symbols-outlined text-[18px]">currency_rupee</span>
                <span>Refund & Cancellation Policy (Upcoming)</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA]">
                <h3 className="text-sm font-black text-[#152238]">Payments Not Live Yet</h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  MakeHabit Premium is proposed as a single one-time payment of <strong>₹199</strong> (lifetime access with no recurring subscriptions). However, payment processing is currently in preparation and payments are not available yet.
                </p>
              </div>

              <h3 className="text-base font-black text-[#152238] pt-2">1. Refund Policy Terms</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Because payments are not yet live and no charges can be made, no transactions are currently eligible for processing. Once payment processing is activated, comprehensive and compliant refund and cancellation policies will be posted here.
              </p>

              <h3 className="text-base font-black text-[#152238] pt-2">2. Support Assistance</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                If you have questions regarding future plans or features, support details coming soon.
              </p>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#152238] font-black text-sm">
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                <span>Contact & Support</span>
              </div>
              <p>
                Have a question, feedback, or need assistance with your habit stacks? We are preparing dedicated support channels.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-1">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wide">
                    Support Channel
                  </div>
                  <div className="text-sm font-black text-[#152238]">
                    Support details coming soon.
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Official channel being established</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-1">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wide">
                    Official Website
                  </div>
                  <div className="text-sm font-black text-[#152238]">
                    <a href="https://makehabit.me" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF704F] transition-colors">
                      https://makehabit.me
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Live production domain</p>
                </div>
              </div>

              {/* Support Notice */}
              <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-2">
                <h3 className="text-sm font-black text-[#152238] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#FF704F]">mark_email_unread</span>
                  <span>Direct Communication</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Official support contact details will be posted here as soon as our dedicated support helpdesk is live. In the meantime, you have complete control to edit, pause, or delete any of your habits directly inside MakeHabit.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 bg-white border-t border-[#F0E6DA] px-6 py-4 sm:px-8 sm:py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <HabitBuddy mood="happy" size="sm" />
            <span>MakeHabit · Built for real consistency</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#152238] text-xs font-black transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
