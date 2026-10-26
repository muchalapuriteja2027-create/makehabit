import express, { Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { initializeApp, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Firestore, Transaction } from 'firebase-admin/firestore';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK if credentials exist on Render
let adminApp: App | null = null;
let adminDb: Firestore | null = null;

const initFirebaseAdmin = () => {
  if (adminApp && adminDb) return { adminApp, adminDb };
  try {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'tangential-realm-08f9p';
    const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-makehabit-64d2424e-d978-4e00-aa84-e6bfb582bbe9';

    if (serviceAccountRaw && serviceAccountRaw.trim().length > 0) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountRaw);
      } catch {
        const decoded = Buffer.from(serviceAccountRaw, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      }
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      adminDb = getFirestore(adminApp, databaseId);
      console.log('Firebase Admin SDK initialized successfully with service account.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId,
      });
      adminDb = getFirestore(adminApp, databaseId);
      console.log('Firebase Admin SDK initialized with Google applicationDefault.');
    } else {
      console.log(
        'Notice: FIREBASE_SERVICE_ACCOUNT is not yet configured in Render environment variables. Server HMAC signature verification will succeed, and server-side Firestore entitlement activation will be enabled once the service account key is linked.'
      );
    }
  } catch (err: unknown) {
    console.error('Firebase Admin SDK initialization notice:', err);
  }
  return { adminApp, adminDb };
};

// Initialize on boot
initFirebaseAdmin();

// Render Backend CORS Configuration
app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://makehabit.me',
    'https://www.makehabit.me',
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  const isAllowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.endsWith('.onrender.com') ||
    origin.endsWith('.run.app');

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

// Helper: Determine credentials based on mode (Live vs Test)
const getRazorpayCredentials = () => {
  const requestedMode = (process.env.RAZORPAY_MODE || 'test').toLowerCase();
  const hasLiveKeys = Boolean(process.env.RAZORPAY_LIVE_KEY_ID && process.env.RAZORPAY_LIVE_KEY_SECRET);
  const isLive = requestedMode === 'live' && hasLiveKeys;

  const keyId = isLive
    ? process.env.RAZORPAY_LIVE_KEY_ID!
    : (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '');
  const keySecret = isLive
    ? process.env.RAZORPAY_LIVE_KEY_SECRET!
    : (process.env.RAZORPAY_KEY_SECRET || '');

  return {
    keyId,
    keySecret,
    mode: (isLive ? 'live' : 'test') as 'live' | 'test',
    isLive,
  };
};

// Helper: Verify Firebase Auth ID token if available
const verifyFirebaseToken = async (authHeader?: string): Promise<{ uid: string; email?: string } | null> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) return null;

  const { adminApp } = initFirebaseAdmin();
  if (!adminApp) return null;

  try {
    const decoded = await getAuth(adminApp).verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    console.warn('ID token verification failed:', err);
    return null;
  }
};

/**
 * Health check endpoint for Render and uptime monitoring
 */
app.get('/health', (_req: Request, res: Response) => {
  const { adminApp } = initFirebaseAdmin();
  res.status(200).json({
    status: 'ok',
    service: 'makehabit-api',
    adminConfigured: Boolean(adminApp),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Root endpoint
 */
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'MakeHabit Razorpay API',
    status: 'online',
    health: '/health',
  });
});

/**
 * Razorpay configuration status (Public Key ID preview only; secret NEVER returned)
 */
app.get('/api/razorpay/status', (_req: Request, res: Response) => {
  const { keyId, keySecret, mode, isLive } = getRazorpayCredentials();
  const { adminApp } = initFirebaseAdmin();
  res.json({
    paymentsLive: isLive,
    mode,
    planProposedPrice: '₹199 one-time',
    hasKeyId: Boolean(keyId),
    hasSecret: Boolean(keySecret),
    keyId: keyId || null,
    keyIdPreview: keyId ? `${keyId.substring(0, 8)}...` : null,
    adminConfigured: Boolean(adminApp),
  });
});

/**
 * Razorpay: Create Order endpoint
 * Securely creates a ₹199 (19900 paise) order on the server
 */
app.post('/api/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const { keyId, keySecret, mode } = getRazorpayCredentials();

    if (!keyId || !keySecret) {
      res.status(503).json({
        success: false,
        isConfigured: false,
        error:
          'Razorpay credentials are not yet configured on the Render backend. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Render Environment Variables.',
      });
      return;
    }

    const { userId, userEmail } = req.body;
    const verifiedUser = await verifyFirebaseToken(req.headers.authorization);

    if (mode === 'live' && !verifiedUser) {
      res.status(401).json({
        success: false,
        error: 'Live checkout requires a verified Google sign-in.',
      });
      return;
    }

    if (!userId || userId === 'guest' || (verifiedUser && verifiedUser.uid !== userId)) {
      res.status(403).json({
        success: false,
        error: 'A signed-in account matching the requested order userId is required.',
      });
      return;
    }

    const { adminDb } = initFirebaseAdmin();
    if (mode === 'live' && !adminDb) {
      res.status(503).json({
        success: false,
        error: 'Live checkout is disabled until secure server-side Premium activation is configured.',
      });
      return;
    }

    // Check if user is already Premium in Firestore
    if (adminDb && userId) {
      try {
        const userDoc = await adminDb.doc(`users/${userId}`).get();
        if (userDoc.exists && userDoc.data()?.plan === 'premium') {
          res.status(400).json({
            success: false,
            error: 'This account already has MakeHabit Premium Lifetime access.',
          });
          return;
        }
      } catch (err) {
        console.warn('Could not verify existing plan in Firestore:', err);
      }
    }

    const amountInPaise = 19900; // Fixed ₹199.00 in paise
    const effectiveUserId = verifiedUser?.uid || userId;
    const receiptId = `rcpt_${effectiveUserId.substring(0, 10)}_${Date.now()}`;

    // Call Razorpay API with HTTP Basic Auth
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          plan: 'premium_lifetime',
          mode,
          userId: effectiveUserId,
          email: verifiedUser?.email || userEmail || '',
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json().catch(() => ({}));
      res.status(razorpayResponse.status).json({
        success: false,
        error: errorData.error?.description || 'Failed to create Razorpay order.',
      });
      return;
    }

    const orderData = await razorpayResponse.json();

    res.json({
      success: true,
      isConfigured: true,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId,
      mode,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error creating order';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Razorpay: Server-Side HMAC Payment Verification & Secure Entitlement
 * Cryptographically verifies HMAC SHA256 signature and activates Premium
 */
app.post('/api/razorpay/verify-payment', async (req: Request, res: Response) => {
  try {
    const { keySecret, mode } = getRazorpayCredentials();

    if (!keySecret) {
      res.status(503).json({
        success: false,
        error: 'Razorpay Secret is not configured on the server. Verification unavailable.',
      });
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        success: false,
        error: 'Missing order_id, payment_id, or signature in request body.',
      });
      return;
    }

    const verifiedUser = await verifyFirebaseToken(req.headers.authorization);
    if (mode === 'live' && !verifiedUser) {
      res.status(401).json({
        success: false,
        verified: false,
        error: 'Live payment verification requires a verified Google sign-in.',
      });
      return;
    }
    if (!userId || userId === 'guest' || (verifiedUser && verifiedUser.uid !== userId)) {
      res.status(403).json({
        success: false,
        verified: false,
        error: 'Payment verification failed: authenticated user does not match the order user.',
      });
      return;
    }

    // Expected signature: HMAC SHA-256 of order_id + "|" + payment_id
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(razorpay_signature);
    const expectedBuffer = Buffer.from(generatedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid payment signature. Verification failed.',
      });
      return;
    }

    // Confirm with Razorpay itself that the signed order belongs to this user,
    // has the fixed product price, and was actually captured. A valid HMAC alone
    // is not sufficient to grant an entitlement to a client-supplied user ID.
    const { keyId } = getRazorpayCredentials();
    const razorpayAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const razorpayHeaders = { Authorization: `Basic ${razorpayAuth}` };

    const [orderResponse, paymentResponse] = await Promise.all([
      fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`, {
        method: 'GET',
        headers: razorpayHeaders,
      }),
      fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpay_payment_id)}`, {
        method: 'GET',
        headers: razorpayHeaders,
      }),
    ]);

    if (!orderResponse.ok || !paymentResponse.ok) {
      res.status(502).json({
        success: false,
        verified: false,
        error: 'Could not confirm the order and captured payment with Razorpay.',
      });
      return;
    }

    const order = await orderResponse.json();
    const payment = await paymentResponse.json();

    const orderMatches = order.id === razorpay_order_id
      && order.amount === 19900
      && order.currency === 'INR'
      && order.status === 'paid'
      && order.notes?.plan === 'premium_lifetime'
      && order.notes?.userId === (verifiedUser?.uid || userId)
      && order.notes?.mode === mode;
    const paymentMatches = payment.id === razorpay_payment_id
      && payment.order_id === razorpay_order_id
      && payment.amount === 19900
      && payment.currency === 'INR'
      && payment.status === 'captured'
      && payment.captured === true;

    if (!orderMatches || !paymentMatches) {
      res.status(400).json({
        success: false,
        verified: false,
        error: 'Razorpay did not confirm a captured ₹199 payment for this account and plan.',
      });
      return;
    }

    // Test transactions verify the checkout flow only. Never grant production
    // Premium access or write a payment receipt for a Test Mode transaction.
    if (mode === 'test') {
      res.json({
        success: true,
        verified: true,
        entitlementGranted: false,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        mode,
        message: 'Test payment verified. Premium was not activated because this is Test Mode.',
      });
      return;
    }

    const effectiveUid = verifiedUser?.uid || userId;
    const { adminDb } = initFirebaseAdmin();
    if (!adminDb) {
      res.status(503).json({
        success: false,
        verified: true,
        entitlementGranted: false,
        error: 'Payment was verified, but secure Premium activation is unavailable. Contact support before retrying payment.',
      });
      return;
    }

    let entitlementGranted = false;
    let entitlementMessage = 'Payment signature verified successfully.';

    if (adminDb && effectiveUid && effectiveUid !== 'guest') {
      try {
        // Save the receipt and activate Premium atomically. A retry is safe and
        // cannot report success for a payment recorded against another account.
        const paymentDocRef = adminDb.doc(`payments/${razorpay_payment_id}`);
        const userDocRef = adminDb.doc(`users/${effectiveUid}`);
        const activationResult = await adminDb.runTransaction(async (transaction: Transaction) => {
          const existingPayment = await transaction.get(paymentDocRef);
          if (existingPayment.exists && existingPayment.data()?.status === 'captured') {
            const existingData = existingPayment.data();
            if (existingData?.userId !== effectiveUid || existingData?.orderId !== razorpay_order_id) {
              throw new Error('Payment ID is already associated with a different account or order.');
            }
            return 'duplicate' as const;
          }

          const now = new Date().toISOString();
          transaction.set(paymentDocRef, {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            userId: effectiveUid,
            amount: 19900,
            currency: 'INR',
            mode,
            status: 'captured',
            plan: 'premium',
            verifiedAt: now,
          });
          transaction.set(userDocRef, {
            plan: 'premium',
            premiumActivatedAt: now,
            premiumPaymentId: razorpay_payment_id,
            updatedAt: now,
          }, { merge: true });
          return 'granted' as const;
        });

        if (activationResult === 'duplicate') {
          res.json({
            success: true,
            verified: true,
            entitlementGranted: true,
            isDuplicate: true,
            message: 'Payment already processed and verified.',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            mode,
          });
          return;
        }

        entitlementGranted = true;
        entitlementMessage = 'Payment verified and Premium Lifetime access activated in Firestore!';
      } catch (adminErr) {
        console.error('Error activating Firestore entitlement via Admin SDK:', adminErr);
        entitlementMessage =
          'HMAC payment verified, but automatic Firestore update encountered a permission error. Entitlement will be updated manually.';
      }
    } else if (!adminDb) {
      entitlementMessage =
        'HMAC payment signature verified successfully. Set FIREBASE_SERVICE_ACCOUNT in Render Environment Variables to enable direct server-side Firestore entitlement activation.';
    }

    res.json({
      success: true,
      verified: true,
      entitlementGranted,
      message: entitlementMessage,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      mode,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error verifying payment';
    res.status(500).json({ success: false, error: message });
  }
});

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start listening directly on PORT
app.listen(PORT, () => {
  console.log(`MakeHabit API server running on port ${PORT}`);
});

export default app;
