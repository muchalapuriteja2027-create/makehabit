/**
 * Razorpay Test Mode Client Service
 * 
 * Secure client-side wrapper for Razorpay standard checkout.
 * NOTE: The Razorpay Key Secret is NEVER stored, referenced, or exposed in frontend code.
 * Order creation and HMAC payment verification are performed securely on the Render backend.
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
 * Returns the Render backend API base URL
 */
export const getBackendBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
  const baseUrl = envUrl || 'https://makehabit-twbz.onrender.com';
  return baseUrl.replace(/\/+$/, '');
};

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
 * Checks connectivity to the Render backend /health endpoint
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${getBackendBaseUrl()}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Calls Render backend to create a ₹199 Razorpay order in test mode
 */
export const requestCreateOrder = async (
  userId: string,
  userEmail?: string
): Promise<RazorpayOrderResponse> => {
  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userEmail, plan: 'premium_lifetime', amountInRupees: 199 }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        isConfigured: false,
        error: data.error || `Backend server responded with status ${res.status}`,
      };
    }

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Render backend unreachable';
    return {
      success: false,
      isConfigured: false,
      error: `Could not reach backend (${getBackendBaseUrl()}): ${msg}`,
    };
  }
};

/**
 * Sends payment response parameters to Render backend for cryptographic HMAC verification
 */
export const requestVerifyPayment = async (
  payload: RazorpayPaymentSuccessResult & { userId: string }
): Promise<VerifyPaymentResponse> => {
  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/razorpay/verify-payment`, {
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
