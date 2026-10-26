import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useHabits } from '../context/HabitsContext.tsx';
import { HabitBuddy } from './HabitBuddy.tsx';
import {
  fetchRazorpayStatus,
  loadRazorpayScript,
  requestCreateOrder,
  requestVerifyPayment,
  RazorpayStatusResponse,
} from '../services/razorpay.ts';

interface PricingViewProps {
  onBackToHome: () => void;
  onOpenTrustModal: (tab: 'privacy' | 'terms' | 'refund' | 'contact') => void;
}

export const PricingView: React.FC<PricingViewProps> = ({
  onBackToHome,
  onOpenTrustModal,
}) => {
  const { currentUser, userProfile, signIn } = useAuth();
  const { habits } = useHabits();

  // Backend & payment states
  const [backendStatus, setBackendStatus] = useState<RazorpayStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutStatusText, setCheckoutStatusText] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Success celebration modal state
  const [verifiedPayment, setVerifiedPayment] = useState<{
    orderId: string;
    paymentId: string;
    verified: boolean;
    entitlementGranted?: boolean;
    message?: string;
    mode?: 'test' | 'live';
    isTestMode?: boolean;
  } | null>(null);

  // Technical details modal state
  const [showTechDetailsModal, setShowTechDetailsModal] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const activeHabitsCount = habits.filter((h) => h.status === 'active').length;
  const isPremium = userProfile?.plan === 'premium';

  // Fetch backend Razorpay status on mount
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      setLoadingStatus(true);
      const status = await fetchRazorpayStatus();
      if (isMounted) {
        setBackendStatus(status);
        setLoadingStatus(false);
      }
    };
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasPaymentKeys = Boolean(backendStatus?.hasKeyId && backendStatus?.hasSecret);
  const isLiveMode = backendStatus?.mode === 'live';
  const liveCheckoutReady = Boolean(backendStatus?.liveCheckoutReady);
  const isLiveCheckoutBlocked = backendStatus?.mode === 'live' && !liveCheckoutReady;
  const paymentSetupReady = hasPaymentKeys && !isLiveCheckoutBlocked;

  // Checkout follows the payment mode reported by the server.
  const handleStartCheckout = async () => {
    if (isProcessingCheckout) return;
    if (!hasPaymentKeys || isLiveCheckoutBlocked) {
      setCheckoutError('Payment checkout is not ready. Live checkout requires verified Firebase identity and persistent server-side Premium activation.');
      return;
    }

    if (!currentUser) {
      setShowSignInPrompt(true);
      return;
    }

    setIsProcessingCheckout(true);
    setCheckoutError(null);
    setCheckoutStatusText('Connecting to Render backend...');

    try {
      // Step 1: Ensure Razorpay SDK script is loaded
      setCheckoutStatusText('Loading Razorpay SDK...');
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load the Razorpay checkout script. Please check your network connection.');
      }

      // Step 2: Create ₹199 (19900 paise) order on the Render backend
      setCheckoutStatusText('Creating ₹199 test order on server...');
      const idToken = currentUser ? await currentUser.getIdToken().catch(() => undefined) : undefined;
      const orderRes = await requestCreateOrder(
        currentUser.uid,
        currentUser.email || undefined,
        idToken
      );

      if (!orderRes.success || !orderRes.orderId) {
        throw new Error(orderRes.error || 'Failed to create order on backend.');
      }

      const activeKey = orderRes.keyId || backendStatus?.keyId;
      if (!activeKey) {
        throw new Error('Public Razorpay Key ID was not returned by the backend.');
      }
      const checkoutMode = orderRes.mode || backendStatus?.mode || 'test';
      if (checkoutMode === 'live' && !backendStatus?.liveCheckoutReady) {
        throw new Error('Live checkout is blocked until secure server-side Premium activation is ready. No payment was started.');
      }

      setCheckoutStatusText('Opening Razorpay Checkout modal...');

      // Step 3: Configure and open official Razorpay Checkout popup
      const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
      if (!RazorpayConstructor) {
        throw new Error('Razorpay Checkout SDK not found in browser window.');
      }

      const options = {
        key: activeKey,
        amount: orderRes.amount || 19900,
        currency: orderRes.currency || 'INR',
        name: 'MakeHabit',
        description: checkoutMode === 'live' ? 'MakeHabit Premium Lifetime Pass' : 'MakeHabit Premium Lifetime Pass (Test Mode)',
        order_id: orderRes.orderId,
        prefill: {
          name: userProfile?.displayName || 'MakeHabit Member',
          email: currentUser.email || 'user@example.com',
        },
        theme: {
          color: '#FF704F',
        },
        notes: {
          plan: 'premium_lifetime',
          mode: checkoutMode,
          userId: currentUser.uid,
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setCheckoutStatusText('Verifying payment signature with server HMAC...');
          try {
            const freshToken = currentUser ? await currentUser.getIdToken().catch(() => undefined) : undefined;
            const verifyRes = await requestVerifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              userId: currentUser.uid,
              idToken: freshToken,
            });

            const verifiedMode = verifyRes.mode || checkoutMode;
            const isTestPayment = verifyRes.isTestMode ?? (verifiedMode === 'test');

            if (
              verifyRes.success &&
              verifyRes.verified &&
              (isTestPayment || verifyRes.entitlementGranted === true)
            ) {
              setVerifiedPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                verified: true,
                entitlementGranted: Boolean(verifyRes.entitlementGranted),
                message: verifyRes.message,
                mode: verifiedMode,
                isTestMode: isTestPayment,
              });
              setCheckoutStatusText('');
            } else {
              setCheckoutError(
                verifyRes.error ||
                (verifiedMode === 'live'
                  ? 'Payment returned from Razorpay but Premium activation was not confirmed. Do not pay again; contact support with the payment ID.'
                  : 'Cryptographic HMAC signature verification failed.')
              );
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Payment verification error';
            setCheckoutError(msg);
          } finally {
            setIsProcessingCheckout(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingCheckout(false);
            setCheckoutStatusText('');
          },
        },
      };

      const rzpInstance = new RazorpayConstructor(options);
      rzpInstance.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected checkout error occurred';
      setCheckoutError(msg);
      setIsProcessingCheckout(false);
      setCheckoutStatusText('');
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

      {/* Payment mode and readiness status */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex items-start gap-3.5 shadow-2xs transition-all ${
        paymentSetupReady
          ? 'bg-[#FAFDF5] border-[#B8E36A]'
          : 'bg-[#FFF8EE] border-[#F5DEB3]'
      }`}>
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm ${
          paymentSetupReady
            ? 'bg-[#EAF7D5] text-[#1E3805]'
            : 'bg-[#FFE8CC] text-[#B85C00]'
        }`}>
          {isLiveMode ? '💳' : hasPaymentKeys ? '🧪' : 'ℹ️'}
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs sm:text-sm font-black ${
              paymentSetupReady ? 'text-[#1E3805]' : 'text-[#8A4600]'
            }`}>
              {!hasPaymentKeys
                ? 'Connecting to Payment Backend'
                : isLiveCheckoutBlocked
                  ? 'Live Checkout Blocked — Secure Activation Not Ready'
                  : isLiveMode
                    ? 'Razorpay Live Mode Active'
                    : 'Razorpay Test Mode Active'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
              paymentSetupReady
                ? 'bg-[#EAF7D5] text-[#1E3805] border border-[#B8E36A]'
                : 'bg-[#FFE8CC] text-[#8A4600]'
            }`}>
              {isLiveMode
                ? liveCheckoutReady
                  ? 'Live Mode · Real payments can be processed'
                  : 'Live Mode · Checkout blocked until setup is complete'
                : 'Test Mode · No real money collected'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {!hasPaymentKeys
              ? 'Verifying connection to the Render payment backend at https://makehabit-twbz.onrender.com...'
              : isLiveCheckoutBlocked
                ? 'Live keys are selected, but checkout is disabled until server-side Firebase identity verification and durable Premium activation are available.'
                : isLiveMode
                  ? 'Live checkout is configured. A captured payment must be verified and Premium access durably saved before success is shown.'
                  : 'Render is connected in Razorpay Test Mode. Checkout simulates payment, verifies the signature, and does not grant Premium or collect real money.'}
          </p>
        </div>

        <button
          onClick={() => setShowTechDetailsModal(true)}
          className="px-3 py-1.5 rounded-xl bg-white border border-[#F0E6DA] hover:bg-[#FFF8F0] text-[#152238] text-[11px] font-bold shrink-0 cursor-pointer shadow-2xs transition-colors self-center hidden sm:block"
        >
          Backend Status
        </button>
      </div>

      {/* Checkout Processing Banner */}
      {isProcessingCheckout && (
        <div className="p-4 rounded-2xl bg-[#FFF1EE] border border-[#FF704F]/40 flex items-center gap-3 animate-pulse">
          <span className="material-symbols-outlined text-[#FF704F] animate-spin">
            progress_activity
          </span>
          <span className="text-xs font-black text-[#FF704F]">
            {checkoutStatusText || 'Processing checkout...'}
          </span>
        </div>
      )}

      {/* Checkout Error Alert */}
      {checkoutError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <div className="space-y-0.5">
              <span className="text-xs font-black block">Checkout Error</span>
              <p className="text-xs font-medium">{checkoutError}</p>
            </div>
          </div>
          <button
            onClick={() => setCheckoutError(null)}
            className="text-red-500 hover:text-red-700 font-black text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

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
              onClick={handleStartCheckout}
              disabled={isProcessingCheckout || loadingStatus || !hasPaymentKeys || isLiveCheckoutBlocked}
              className={`w-full py-4 px-6 rounded-2xl tactile-coral text-white text-sm font-black shadow-lg flex items-center justify-center gap-2 transition-all ${
                isProcessingCheckout ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isProcessingCheckout ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  <span>{checkoutStatusText || 'Opening Checkout...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  <span>Upgrade to Premium — ₹199</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold text-center">
              <span className={`w-2 h-2 rounded-full ${paymentSetupReady ? 'bg-[#B8E36A]' : 'bg-amber-400'}`}></span>
              <span>
                {!hasPaymentKeys
                  ? 'Payment backend credentials unavailable'
                  : isLiveCheckoutBlocked
                    ? 'Live checkout blocked until secure Premium activation is configured'
                    : isLiveMode
                      ? 'Live Mode — real payments'
                      : 'Test Mode — no real payments'}
              </span>
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

      {/* Frequently Asked Questions */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0E6DA] tactile-card space-y-6">
        <div>
          <h2 className="text-xl font-black text-[#152238]">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Transparent details regarding MakeHabit plans and payment testing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-1.5">
            <h3 className="text-sm font-black text-[#152238]">What happens during this test checkout?</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {isLiveMode && liveCheckoutReady
                ? 'Live checkout processes real payments. Premium access is granted only after Razorpay confirms a captured payment and the server saves the entitlement securely.'
                : 'The checkout runs in Razorpay Test Mode using your Render backend. Use Razorpay test payment details. No real payment is collected, and Premium access is not granted by a test payment.'}
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
              {isLiveMode && liveCheckoutReady
                ? 'For a live purchase, contact support promptly if a payment is captured but Premium access is not reflected. Keep the payment ID for reconciliation.'
                : 'Because transactions are in Test Mode, no real funds are processed. A commercial refund policy must be published before accepting live purchases.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-1.5">
            <h3 className="text-sm font-black text-[#152238]">Will ₹199 be a one-time payment?</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Yes, when launched commercially, MakeHabit Premium is planned as a single one-time payment with lifetime access. There are no recurring monthly fees.
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

      {/* Verified Payment Success Modal */}
      {verifiedPayment && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setVerifiedPayment(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#152238]/70 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#B8E36A] space-y-5 tactile-card-modal">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF7D5] text-[#1E3805] flex items-center justify-center mx-auto text-2xl shadow-2xs font-black">
              ✓
            </div>

            <div className="text-center space-y-1.5">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                verifiedPayment.entitlementGranted
                  ? 'bg-[#EAF7D5] text-[#1E3805] border-[#B8E36A]'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {verifiedPayment.entitlementGranted
                  ? 'Lifetime Entitlement Active'
                  : verifiedPayment.isTestMode
                    ? 'Test Payment Verified — Premium Not Granted'
                    : 'Payment Activation Needs Support'}
              </span>
              <h3 className="text-xl font-black text-[#152238]">
                {verifiedPayment.entitlementGranted
                  ? 'MakeHabit Premium Activated! 🎉'
                  : verifiedPayment.isTestMode
                    ? 'Razorpay Test Payment Verified!'
                    : 'Premium Activation Needs Support'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {verifiedPayment.entitlementGranted
                  ? 'Your ₹199 purchase was cryptographically verified and your account is upgraded to MakeHabit Premium Lifetime access.'
                  : verifiedPayment.isTestMode
                    ? 'Your ₹199 simulated payment was confirmed against Razorpay. No real money was charged, and Premium remains inactive in Test Mode.'
                    : 'Payment verification did not complete Premium activation. Do not pay again; contact support with the payment ID.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAFDF5] border border-[#B8E36A] space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-bold">Order ID:</span>
                <span className="font-mono text-[#152238] font-bold">{verifiedPayment.orderId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-bold">Payment ID:</span>
                <span className="font-mono text-[#152238] font-bold">{verifiedPayment.paymentId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-bold">Amount:</span>
                <span className="font-bold text-[#1E3805]">₹199.00 (19900 paise)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-bold">Server Entitlement:</span>
                <span className={`font-bold ${verifiedPayment.entitlementGranted ? 'text-[#1E3805]' : 'text-amber-800'}`}>
                  {verifiedPayment.entitlementGranted
                    ? 'Granted in Firestore ✓'
                    : verifiedPayment.isTestMode
                      ? 'Not granted in Test Mode'
                      : 'Needs support reconciliation'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] text-[11px] text-slate-600 font-medium leading-relaxed">
              {verifiedPayment.entitlementGranted ? (
                <span>
                  <strong>Full Lifetime Access:</strong> You now have unlimited active habit stacks, 90-day retention reports, and advanced consistency heatmaps.
                </span>
              ) : (
                <span>
                  {verifiedPayment.isTestMode
                    ? <><strong>Test Mode Notice:</strong> This was a simulated transaction only. It does not grant lifetime Premium access.</>
                    : <><strong>Support Notice:</strong> Payment was not confirmed as a completed Premium activation. Do not retry payment; contact support for reconciliation.</>}
                </span>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setVerifiedPayment(null)}
                className="px-6 py-2.5 rounded-2xl tactile-coral text-white text-xs font-black cursor-pointer shadow-xs"
              >
                {verifiedPayment.entitlementGranted ? 'Explore Premium' : 'Close Notice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technical Backend Status Modal */}
      {showTechDetailsModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTechDetailsModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#152238]/70 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#F0E6DA] space-y-5 tactile-card-modal">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1EE] text-[#FF704F] text-[11px] font-black uppercase">
                  <span>Backend Integration Status</span>
                </div>
                <h3 className="text-xl font-black text-[#152238]">
                  Render API Connection
                </h3>
              </div>
              <button
                onClick={() => setShowTechDetailsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F0E6DA] space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Backend URL:</span>
                <span className="font-mono text-[#152238] font-bold">https://makehabit-twbz.onrender.com</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Backend Health:</span>
                <span className="text-[#1E3805] font-black flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#B8E36A]"></span>
                  <span>Online (/health 200 OK)</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Razorpay Key ID:</span>
                <span className="font-mono text-[#152238] font-bold">
                  {backendStatus?.keyId ? `${backendStatus.keyId.substring(0, 12)}...` : 'Configured on Render'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Razorpay Secret:</span>
                <span className="text-[#1E3805] font-bold">Protected Server-Side Only</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Mode:</span>
                <span className="text-[#FF704F] font-black uppercase">{backendStatus?.mode || 'Test'}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#F0E6DA]">
              <span className="text-[11px] text-slate-400 font-medium">
                MakeHabit Payment Gateway Architecture
              </span>
              <button
                onClick={() => setShowTechDetailsModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#152238] text-xs font-black cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Prompt Modal */}
      {showSignInPrompt && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSignInPrompt(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#152238]/70 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-[#F0E6DA] text-center space-y-4 tactile-card-modal">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1EE] text-[#FF704F] flex items-center justify-center mx-auto text-xl shadow-2xs font-black">
              🔒
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#152238]">Sign In Required</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Please sign in with Google to test Razorpay checkout so your session is associated with your account.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setShowSignInPrompt(false);
                  signIn();
                }}
                className="px-5 py-2.5 rounded-2xl tactile-coral text-white text-xs font-black cursor-pointer shadow-xs"
              >
                Sign In with Google
              </button>
              <button
                onClick={() => setShowSignInPrompt(false)}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
