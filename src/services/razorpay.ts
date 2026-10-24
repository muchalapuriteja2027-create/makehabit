/**
 * Razorpay Test Mode Client Service
 * 
 * Secure client-side wrapper for Razorpay standard checkout.
 * NOTE: The Razorpay Key Secret is NEVER stored, referenced, or exposed in frontend code.
 * Order creation and HMAC payment verification are performed securely on the Render backend.
 */

export interface RazorpayStatusResponse {
  paymentsLive: boolean;
  mode: 'test' | 'live';
  planProposedPrice: string;
  hasKeyId: boolean;
  hasSecret: boolean;
  keyId?: string | null;
  keyIdPreview?: string | null;
}

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
  entitlementGranted?: boolean;
  isDuplicate?: boolean;
  message?: string;
  paymentId?: string;
  orderId?: string;
  mode?: 'test' | 'live';
  error?: string;
}

// In-memory cache for the public Razorpay Key ID fetched from backend
let cachedPublicRazorpayKeyId: string | null = null;

/**
 * Returns the Render backend API base URL
 */
export const getBackendBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
  const baseUrl = envUrl && envUrl.trim().length > 0 ? envUrl.trim() : 'https://makehabit-twbz.onrender.com';
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
 * Fetches Razorpay configuration status from the Render backend.
 * Returns public Key ID when available, never the secret.
 */
export const fetchRazorpayStatus = async (): Promise<RazorpayStatusResponse | null> => {
  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/razorpay/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return null;
    const data: RazorpayStatusResponse = await res.json();
    if (data.keyId) {
      cachedPublicRazorpayKeyId = data.keyId;
    }
    return data;
  } catch {
    return null;
  }
};

/**
 * Retrieves the public Razorpay Key ID:
 * 1. Checks client-side environment variable (if set in build)
 * 2. Checks in-memory cache
 * 3. Dynamically fetches from Render /api/razorpay/status
 */
export const getOrFetchRazorpayKey = async (): Promise<string> => {
  const envKey = (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '';
  if (envKey && !envKey.includes('YourTestKeyId')) {
    return envKey;
  }

  if (cachedPublicRazorpayKeyId) {
    return cachedPublicRazorpayKeyId;
  }

  const status = await fetchRazorpayStatus();
  if (status?.keyId) {
    cachedPublicRazorpayKeyId = status.keyId;
    return status.keyId;
  }

  return '';
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
 * Calls Render backend to create a ₹199 Razorpay order (19900 paise)
 */
export const requestCreateOrder = async (
  userId: string,
  userEmail?: string,
  idToken?: string
): Promise<RazorpayOrderResponse> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const res = await fetch(`${getBackendBaseUrl()}/api/razorpay/create-order`, {
      method: 'POST',
      headers,
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

    const data: RazorpayOrderResponse = await res.json();
    if (data.keyId) {
      cachedPublicRazorpayKeyId = data.keyId;
    }
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
 * Sends payment response parameters to Render backend for cryptographic HMAC verification and entitlement
 */
export const requestVerifyPayment = async (
  payload: RazorpayPaymentSuccessResult & { userId: string; idToken?: string }
): Promise<VerifyPaymentResponse> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (payload.idToken) {
      headers['Authorization'] = `Bearer ${payload.idToken}`;
    }

    const res = await fetch(`${getBackendBaseUrl()}/api/razorpay/verify-payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data: VerifyPaymentResponse = await res.json();
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
