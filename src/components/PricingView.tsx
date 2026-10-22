import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useHabits } from '../context/HabitsContext.tsx';
import { HabitBuddy } from './HabitBuddy.tsx';
import {
  getClientRazorpayKey,
  loadRazorpayScript,
  requestCreateOrder,
  requestVerifyPayment,
} from '../services/razorpay.ts';

interface PricingViewProps {
  onBackToHome: () => void;
  onOpenTrustModal: (tab: 'privacy' | 'terms' | 'refund' | 'contact') => void;
}

export const PricingView: React.FC<PricingViewProps> = ({
  onBackToHome,
  onOpenTrustModal,
}) => {
  const { currentUser, userProfile } = useAuth();
  const { habits } = useHabits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [testingPayment, setTestingPayment] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const activeHabitsCount = habits.filter((h) => h.status === 'active').length;
  const isPremium = userProfile?.plan === 'premium';
  const hasClientKey = Boolean(getClientRazorpayKey());

  const handleTestCheckout = async () => {
    setTestingPayment(true);
    setTestResult({ status: 'idle', message: '' });

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setTestResult({
          status: 'error',
          message: 'Could not load Razorpay SDK. Please check your internet connection.',
        });
        setTestingPayment(false);
        return;
      }

      const clientKey = getClientRazorpayKey();
      if (!clientKey) {
        setTestResult({
          status: 'error',
          message:
            'Razorpay Test Key ID (VITE_RAZORPAY_KEY_ID) is not configured yet. See manual setup steps in README or .env.example.',
        });
        setTestingPayment(false);
        return;
      }

      // Call backend to create order securely
      const orderRes = await requestCreateOrder(
        currentUser?.uid || 'test-user',
        currentUser?.email || undefined
      );

      if (!orderRes.success || !orderRes.orderId) {
        setTestResult({
          status: 'error',
          message:
            orderRes.error ||
            'Backend order creation endpoint is currently in test configuration. Payments are not live yet.',
        });
        setTestingPayment(false);
        return;
      }

      // If order successfully created, open Razorpay Checkout in Test Mode
      const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
      if (!RazorpayConstructor) {
        setTestResult({
          status: 'error',
          message: 'Razorpay Checkout object not found in window context.',
        });
        setTestingPayment(false);
        return;
      }

      const options = {
        key: orderRes.keyId || clientKey,
        amount: orderRes.amount || 19900,
        currency: orderRes.currency || 'INR',
        name: 'MakeHabit',
        description: 'Premium Lifetime Pass (Test Mode)',
        order_id: orderRes.orderId,
        prefill: {
          name: userProfile?.displayName || 'MakeHabit Member',
          email: currentUser?.email || 'user@example.com',
        },
        theme: {
          color: '#FF704F',
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // Perform server-side HMAC cryptographic verification
          const verifyRes = await requestVerifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            userId: currentUser?.uid || 'test-user',
          });

          if (verifyRes.success && verifyRes.verified) {
            setTestResult({
              status: 'success',
              message:
                'Test payment verified successfully via server HMAC! (No real money was charged)',
            });
          } else {
            setTestResult({
              status: 'error',
              message: verifyRes.error || 'Server HMAC verification failed.',
            });
          }
        },
        modal: {
          ondismiss: () => {
            setTestingPayment(false);
          },
        },
      };

      const rzpInstance = new RazorpayConstructor(options);
      rzpInstance.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error starting test checkout';
      setTestResult({ status: 'error', message: msg });
    } finally {
      setTestingPayment(false);
    }
  };

  return (
    <div className="space-y-10 sm:space-y-12 animate-fadeIn pb-16 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1EE] text-[#FF704F] text-xs font-black mb-2">
            <span className="material-symbols-outlined text-[16px]">sell</span>
            <span>Simple, Honest Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#152238] tracking-tight">
            Invest in your habits. Not a subscription.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl font-medium">
            Start free with core habit stacking essentials, or unlock lifetime consistency tools for a simple proposed one-time payment of ₹199.
          </p>
        </div>

        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#F0E6DA] hover:bg-[#FFF8F0] text-[#152238] text-xs font-black transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back to Today</span>
        </button>
      </div>

      {/* Prominent Payment Availability Notice */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FFF8EE] border border-[#F5DEB3] flex items-start gap-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-2xl bg-[#FFE8CC] text-[#B85C00] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px]">info</span>
        </div>
        <div className="space-y-1">
          <div className="text-xs sm:text-sm font-black text-[#8A4600] flex items-center gap-2">
            <span>Payments Are Not Available Yet</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FFE8CC] text-[10px] font-black uppercase tracking-wide">
              Test Mode Preparation
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            We are preparing the proposed ₹199 one-time Premium plan with secure Razorpay Test Mode integration. Real card, UPI, and netbanking transactions are not yet active, and no money can be charged at this time. Your Free plan remains 100% active with full access to daily habit check-ins and streaks.
          </p>
        </div>
      </div>

      {/* Side-by-Side Plans Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        {/* FREE PLAN */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0E6DA] tactile-card flex flex-col justify-between relative space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                  Starter Tier
                </span>
                <h2 className="text-2xl font-black text-[#152238]">Free Plan</h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black">
                {isPremium ? 'Included' : 'Current Plan'}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Everything you need to anchor your first foundational routines and build momentum.
            </p>

            <div className="pt-2 flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#152238]">₹0</span>
              <span className="text-xs font-bold text-slate-400">/ forever</span>
            </div>

            {/* Free Plan Features List */}
            <div className="space-y-3 pt-4 border-t border-[#F0E6DA]">
              <span className="text-xs font-black text-[#152238] block uppercase tracking-wide">
                What's included:
              </span>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#EAF7D5] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs">
                    ✓
                  </span>
                  <span><strong>Up to 3 active habit stacks</strong> (currently {activeHabitsCount}/3 used)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#EAF7D5] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs">
                    ✓
                  </span>
                  <span><strong>Daily habit check-ins</strong> with tactile completion feedback</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#EAF7D5] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs">
                    ✓
                  </span>
                  <span><strong>Streak tracking</strong> & unbroken daily flame counter</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#EAF7D5] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs">
                    ✓
                  </span>
                  <span><strong>Basic weekly progress</strong> (past 7-day consistency view)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#EAF7D5] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs">
                    ✓
                  </span>
                  <span><strong>Habit categories</strong> (Health, Work, Personal)</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-400">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 font-black flex items-center justify-center shrink-0 text-xs">
                    —
                  </span>
                  <span>30-day and 90-day progress reports</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-400">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 font-black flex items-center justify-center shrink-0 text-xs">
                    —
                  </span>
                  <span>Habit consistency heatmaps</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6">
            <button
              disabled
              className="w-full py-3.5 px-5 rounded-2xl bg-[#F5EFE6] text-slate-500 text-xs sm:text-sm font-black text-center cursor-default"
            >
              ✓ Always Free & Active
            </button>
          </div>
        </div>

        {/* PREMIUM PLAN */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#FF704F] tactile-card flex flex-col justify-between relative space-y-6 shadow-xl ring-4 ring-[#FF704F]/10">
          {/* Badge */}
          <div className="absolute -top-3.5 right-6 bg-[#FF704F] text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-md tracking-wide uppercase flex items-center gap-1">
            <span>✨</span>
            <span>Proposed · ₹199 One-Time</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-[#FF704F] uppercase tracking-wider block">
                  Proposed Upgrade
                </span>
                <h2 className="text-2xl font-black text-[#152238]">MakeHabit Premium</h2>
              </div>
              <HabitBuddy mood="celebrating" size="sm" />
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              For lifelong consistency, deep behavioral insights, and unlimited daily routines.
            </p>

            <div className="pt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#152238]">₹199</span>
              <span className="text-xs font-black text-[#FF704F] bg-[#FFF1EE] px-2.5 py-0.5 rounded-full">
                Proposed One-Time Payment
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium -mt-2">
              Pay once, use forever. No monthly subscriptions, no recurring charges.
            </p>

            {/* Premium Features List */}
            <div className="space-y-3 pt-4 border-t border-[#F0E6DA]">
              <span className="text-xs font-black text-[#152238] block uppercase tracking-wide">
                Planned features in Premium:
              </span>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#B8E36A] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs shadow-2xs">
                    ✓
                  </span>
                  <span><strong className="text-[#152238]">Unlimited active habit stacks</strong> (morning, midday, shutdown & night)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#B8E36A] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs shadow-2xs">
                    ✓
                  </span>
                  <span><strong className="text-[#152238]">Detailed 30-day and 90-day progress reports</strong> to analyze retention</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#B8E36A] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs shadow-2xs">
                    ✓
                  </span>
                  <span><strong className="text-[#152238]">Habit consistency heatmaps</strong> for high-visibility visual habit tracking</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#B8E36A] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs shadow-2xs">
                    ✓
                  </span>
                  <span><strong className="text-[#152238]">Premium themes, custom icons and color palettes</strong> to personalize routines</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#B8E36A] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs shadow-2xs">
                    ✓
                  </span>
                  <span><strong className="text-[#152238]">Additional ready-made habit templates</strong> curated by behavioral science</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#B8E36A] text-[#1E3805] font-black flex items-center justify-center shrink-0 text-xs shadow-2xs">
                    ✓
                  </span>
                  <span><strong className="text-[#152238]">Single lifetime purchase</strong> with no recurring subscriptions or surprise renewals</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <button
              onClick={() => {
                setShowUpgradeModal(true);
                setTestResult({ status: 'idle', message: '' });
              }}
              className="w-full py-4 px-6 rounded-2xl tactile-coral text-white text-sm font-black shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">bolt</span>
              <span>Upgrade to Premium — ₹199</span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold text-center">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Payments not available yet · Test mode in preparation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0E6DA] tactile-card space-y-6">
        <div>
          <h2 className="text-xl font-black text-[#152238]">Plan Comparison</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Transparent breakdown of features across Free and proposed Premium.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#F0E6DA] text-slate-400 font-black text-[11px] uppercase tracking-wider">
                <th className="py-3 px-2 sm:px-4">Feature</th>
                <th className="py-3 px-2 sm:px-4 text-center">Free Plan</th>
                <th className="py-3 px-2 sm:px-4 text-center text-[#FF704F]">MakeHabit Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E6DA] font-semibold text-slate-700">
              <tr>
                <td className="py-3.5 px-2 sm:px-4 font-bold text-[#152238]">Active Habit Stacks</td>
                <td className="py-3.5 px-2 sm:px-4 text-center">Up to 3</td>
                <td className="py-3.5 px-2 sm:px-4 text-center font-black text-[#1E3805] bg-[#FAFDF5]">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3.5 px-2 sm:px-4 font-bold text-[#152238]">Daily Check-ins & Streak Counter</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-[#1E3805]">✓ Included</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-[#1E3805] bg-[#FAFDF5]">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-2 sm:px-4 font-bold text-[#152238]">Weekly 7-Day Consistency Visual</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-[#1E3805]">✓ Included</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-[#1E3805] bg-[#FAFDF5]">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-2 sm:px-4 font-bold text-[#152238]">30-Day and 90-Day Progress Reports</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-slate-300">—</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-[#1E3805] font-black bg-[#FAFDF5]">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-2 sm:px-4 font-bold text-[#152238]">Habit Consistency Heatmaps</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-slate-300">—</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-[#1E3805] font-black bg-[#FAFDF5]">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-2 sm:px-4 font-bold text-[#152238]">Themes, Icons & Custom Colors</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-slate-400">Standard Palette</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-[#1E3805] font-black bg-[#FAFDF5]">Full Theme Pack</td>
              </tr>
              <tr>
                <td className="py-3.5 px-2 sm:px-4 font-bold text-[#152238]">Ready-Made Starter Templates</td>
                <td className="py-3.5 px-2 sm:px-4 text-center">Core Starters (4)</td>
                <td className="py-3.5 px-2 sm:px-4 text-center text-[#1E3805] font-black bg-[#FAFDF5]">Extended Library (20+)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-2 sm:px-4 font-bold text-[#152238]">Price</td>
                <td className="py-3.5 px-2 sm:px-4 text-center font-bold">Free Forever</td>
                <td className="py-3.5 px-2 sm:px-4 text-center font-black text-[#FF704F] bg-[#FAFDF5]">Proposed ₹199 One-Time</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Frequently Asked Questions & Trust */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0E6DA] tactile-card space-y-6">
        <div>
          <h2 className="text-xl font-black text-[#152238]">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Transparent details regarding MakeHabit plans and payment availability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-1.5">
            <h3 className="text-sm font-black text-[#152238]">Are payments currently active?</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              No. Payments are not available yet. We are preparing the Razorpay Test Mode integration, and real payments will only open after gateway verification is complete.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-1.5">
            <h3 className="text-sm font-black text-[#152238]">What happens to my existing habits?</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Your routines, check-in history, and streaks are 100% saved in your private account. The Free plan continues to work without interruption.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-1.5">
            <h3 className="text-sm font-black text-[#152238]">What is the refund policy?</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Because payments are not yet live and no charges can be made, no transactions exist yet. Comprehensive refund policies will be posted prior to opening live purchases.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-1.5">
            <h3 className="text-sm font-black text-[#152238]">Will ₹199 be a one-time payment?</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Yes, when launched, MakeHabit Premium is planned as a single one-time payment with lifetime access. There are no recurring monthly fees.
            </p>
          </div>
        </div>

        {/* Legal & Trust Links */}
        <div className="pt-4 border-t border-[#F0E6DA] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-bold">
          <span>Read our verified policies:</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenTrustModal('privacy')}
              className="hover:text-[#FF704F] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenTrustModal('terms')}
              className="hover:text-[#FF704F] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onOpenTrustModal('refund')}
              className="hover:text-[#FF704F] transition-colors cursor-pointer"
            >
              Refund Policy
            </button>
            <button
              onClick={() => onOpenTrustModal('contact')}
              className="hover:text-[#FF704F] transition-colors cursor-pointer"
            >
              Contact & Support
            </button>
          </div>
        </div>
      </section>

      {/* Razorpay Integration Modal (Transparent Test Mode State) */}
      {showUpgradeModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUpgradeModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#152238]/70 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#F0E6DA] space-y-5 tactile-card-modal">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1EE] text-[#FF704F] text-[11px] font-black uppercase">
                  <span>Razorpay Integration</span>
                </div>
                <h3 className="text-xl font-black text-[#152238]">
                  Payments Not Available Yet
                </h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              The proposed MakeHabit Premium upgrade (₹199 one-time) is currently undergoing payment gateway setup. <strong>No real payments or charges can be processed at this time.</strong>
            </p>

            {/* Integration Status Card */}
            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-2.5 text-xs">
              <div className="font-black text-[#152238] flex items-center justify-between">
                <span>Architecture Status:</span>
                <span className="text-[#FF704F] font-bold">Test Mode Ready</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8E36A]"></span>
                  <span>Server-side HMAC verification endpoint prepared (/api/razorpay/verify-payment)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8E36A]"></span>
                  <span>Zero secret keys in client-side code or git tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasClientKey ? 'bg-[#B8E36A]' : 'bg-amber-400'}`}></span>
                  <span>
                    Test API Key ID:{' '}
                    {hasClientKey ? (
                      <span className="text-[#1E3805] font-bold">Detected in environment</span>
                    ) : (
                      <span className="text-amber-800 font-bold">Pending test key setup</span>
                    )}
                  </span>
                </li>
              </ul>
            </div>

            {/* Test Simulation Controls */}
            {hasClientKey && (
              <div className="space-y-2">
                <button
                  onClick={handleTestCheckout}
                  disabled={testingPayment}
                  className="w-full py-3 px-4 rounded-2xl bg-[#152238] hover:bg-[#1E304F] text-white text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">science</span>
                  <span>{testingPayment ? 'Connecting Test Gateway...' : 'Simulate Razorpay Test Checkout'}</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 font-medium">
                  Test mode only · Uses official Razorpay sandbox dummy cards/UPI
                </p>
              </div>
            )}

            {/* Test Result Message */}
            {testResult.message && (
              <div
                className={`p-3 rounded-2xl border text-xs font-medium leading-relaxed ${
                  testResult.status === 'success'
                    ? 'bg-[#EAF7D5] border-[#B8E36A] text-[#1E3805]'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#F0E6DA]">
              <span className="text-[11px] text-slate-400 font-medium">
                Your Free plan remains fully active
              </span>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#152238] text-xs font-black cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
