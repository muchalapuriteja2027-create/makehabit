/**
 * Razorpay Test Mode Client Service
 * 
 * Secure client-side wrapper for Razorpay standard checkout.
 * NOTE: The Razorpay Key Secret is NEVER stored, referenced, or exposed in frontend code.
 * Order creation and HMAC payment verification are performed securely on the server backend.
 */

export interface RazorpayOrderResponse {
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  error?: string;
  isConfigured?: boolean;
}

export interface RazorpayPaymentSuccessResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  verified?: boolean;
  error?: string;
}

/**
 * Dynamically loads the official Razorpay Checkout v1 script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Checks if the public Razorpay Key ID is present in client environment
 */
export const getClientRazorpayKey = (): string => {
  return (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '';
};

/**
 * Calls backend to create a ₹199 Razorpay order in test mode
 */
export const requestCreateOrder = async (
  userId: string,
  userEmail?: string
): Promise<RazorpayOrderResponse> => {
  try {
    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userEmail, plan: 'premium_lifetime', amountInRupees: 199 }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        isConfigured: false,
        error: data.error || `Server responded with status ${res.status}`,
      };
    }

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backend unreachable';
    return {
      success: false,
      isConfigured: false,
      error: msg,
    };
  }
};

/**
 * Sends payment response parameters to backend for cryptographic HMAC verification
 */
export const requestVerifyPayment = async (
  payload: RazorpayPaymentSuccessResult & { userId: string }
): Promise<VerifyPaymentResponse> => {
  try {
    const res = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment verification failed';
    return {
      success: false,
      verified: false,
      error: msg,
    };
  }
};
