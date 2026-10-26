# MakeHabit

MakeHabit is a behavioral habit-stacking web application designed to help individuals build enduring daily routines through the proven atomic habit formula:

> **"After I [current habit], I will [new habit]."**

The application provides tactile habit check-ins, unbroken streak counters, weekly consistency visualizations, habit categories (Health, Work, Personal), and celebratory feedback to reinforce positive habits.

Live Website: [https://makehabit.me](https://makehabit.me)  
Payment API: [https://makehabit-twbz.onrender.com](https://makehabit-twbz.onrender.com)

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Canvas-Confetti
- **Backend API**: Node.js, Express, `server.ts` running on Render
- **Authentication**: Firebase Authentication with Google Sign-In (OAuth popup flow)
- **Database**: Google Cloud Firestore (structured per-user document collections)
- **Payments**: Razorpay Test Mode integration with server-side HMAC-SHA256 verification
- **Deployment**:
  - **Frontend**: GitHub Pages (`https://makehabit.me`) with custom domain and SPA router fallback (`404.html`, `CNAME`)
  - **Backend**: Render Web Service (`https://makehabit-twbz.onrender.com`)

---

## Local Setup & Development

### Prerequisites
- Node.js 18 or higher
- npm or bun

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/muchalapuriteja2027-create/makehabit.git
cd makehabit
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` if local overrides are needed:
```bash
cp .env.example .env
```

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | Client | URL of the Render payment backend (defaults to `https://makehabit-twbz.onrender.com`). |
| `VITE_RAZORPAY_KEY_ID` | Client | Public Razorpay Key ID (e.g., `rzp_test_...`). Safe for frontend consumption. |
| `RAZORPAY_KEY_SECRET` | Server | Private Razorpay Secret Key. **Must remain strictly on the server** (e.g., Render Environment Variables). Never commit or expose to frontend. |
| `VITE_CLARITY_PROJECT_ID` | Build/public | Optional Microsoft Clarity project ID. Empty by default; tracking is not injected until configured. |
| `VITE_GOOGLE_SITE_VERIFICATION` | Build/public | Optional Google Search Console HTML-tag token for the `https://makehabit.me/` URL-prefix property. Empty by default. |

For the deployed site, add `VITE_CLARITY_PROJECT_ID` and `VITE_GOOGLE_SITE_VERIFICATION` under **GitHub → Settings → Secrets and variables → Actions → Variables** (not Secrets; these identifiers appear in the public site HTML). The deployment workflow passes them to Vite at build time. Search Console verification should use the HTML-tag method for the URL-prefix property; the token is inserted into the generated page's `<head>`. Submit the existing sitemap at `https://makehabit.me/sitemap.xml` after verifying ownership. Do not put Razorpay private secrets in Vite variables or the frontend build.

### 3. Development Commands
- **Frontend Dev Server**:
  ```bash
  npm run dev
  ```
  Runs Vite on `http://localhost:3000`.

- **Type Check**:
  ```bash
  npx tsc --noEmit
  ```

- **Production Build**:
  ```bash
  npm run build
  ```
  Generates production static assets into `./dist`.

- **Backend API Server**:
  ```bash
  npm start
  ```
  Launches the Express API server on `server.ts`.

---

## Firebase Setup & Authentication

MakeHabit uses Google Firebase for secure user management and database persistence:
- **Configuration**: Loaded from `firebase-applet-config.json`.
- **Google Sign-In**: Uses Firebase `signInWithPopup(auth, googleProvider)` for seamless, cross-domain authentication.
- **Data Model**:
  - `users/{userId}`: Stores user profile metadata (`displayName`, `email`, `plan: 'free' | 'premium'`).
  - `users/{userId}/habits/{habitId}`: User's individual habit stacks (anchor routine, action, category, frequency).
  - `users/{userId}/completions/{completionId}`: Timestamped daily completion records.

---

## Guest Mode & Seamless Cloud Migration

MakeHabit supports instant exploration without requiring Google sign-in:
- **Instant Onboarding**: Visitors can click "Try without signing in" to immediately create, edit, pause, and check off habits.
- **Local Persistence**: Guest habits, daily completion history, and preferences are stored in the browser's `localStorage` (`makehabit_guest_habits`, `makehabit_guest_completions`, `makehabit_guest_prefs`) using the exact same data schema as Firestore.
- **Transparent Notice**: A persistent device-only badge and banner remind guests that data is local to their current device.
- **Zero-Loss Cloud Migration**: When the guest subsequently signs in with Google, `AuthContext` safely reads their local habits and completions, queries their Firestore account (`users/{uid}`) to avoid duplicating existing routines, writes new records to Firestore, verifies successful write operations, and only then clears the local guest storage. If network or permission issues occur, local data is preserved and a notice is presented.

---

## Firestore Security Architecture

Firestore security rules (`firestore.rules`) strictly enforce Attribute-Based Access Control (ABAC) and Zero-Trust data isolation:

1. **Global Default-Deny Catch-All**:
   ```javascript
   match /{document=**} {
     allow read, write: if false;
   }
   ```
   No document in Firestore is accessible unless explicitly permitted by an authenticated ownership rule.

2. **Per-User Ownership Isolation (`isOwner`)**:
   ```javascript
   function isOwner(userId) {
     return request.auth != null && request.auth.uid == userId;
   }
   ```
   All habit definitions and completion logs are stored under `users/{userId}/...`. A user can **only read, create, update, or delete their own documents**. Cross-user data scraping, viewing other users' habits, or editing another user's streaks is mathematically impossible.

3. **No Unauthenticated Public Reads**:
   All test paths and open read blocks have been removed. Access to any user document requires an active, verified Firebase Authentication session.

4. **Input Boundary Enforcement**:
   - Habit anchors and actions are limited to `.size() <= 200` characters.
   - Document IDs are strictly validated with regex (`^[a-zA-Z0-9_\-]+$`) to prevent path traversal or injection.

---

---

## 21-Day Study Habit Challenge (Student Differentiator)

MakeHabit includes a dedicated 21-Day Study Habit Challenge on the Home dashboard:
- **Ready-Made Atomic Study Stacks**:
  1. *Focus Pomodoro Session*: After opening laptop, study for 25 min without distraction.
  2. *Daily Lecture Review*: After finishing evening meal, review lecture flashcards for 15 min.
  3. *Active Recall Check*: After closing textbooks, write down 3 key concepts from memory.
- **Real Tracking & Adherence**: Challenge adherence is calculated directly from actual daily completion records—never from fabricated counts.
- **Universal Compatibility**: Works seamlessly for unauthenticated Guest Mode users (stored in `localStorage`) and authenticated Google accounts (synced to Firestore).
- **Zero Duplication**: Starting the challenge checks for existing study habits and reuses them without duplicating records.

---

## Razorpay Payment Integration & Server Entitlements

MakeHabit provides a secure integration for a proposed **₹199 one-time Lifetime Premium** tier:
- **Order Creation**: The client calls `POST /api/razorpay/create-order` on the Render backend with an optional Firebase ID Token. The server communicates with Razorpay APIs via HTTP Basic Auth using server-side credentials to create an order of exactly 19,900 paise (₹199.00 INR).
- **HMAC-SHA256 Verification**: Upon payment completion in Razorpay Checkout, the payment signature is verified server-side (`POST /api/razorpay/verify-payment`) using HMAC-SHA256 and constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
- **Replay Protection**: The backend verifies payment receipts against Firestore (`payments/{razorpay_payment_id}`) to prevent duplicate or counterfeit activations.
- **Server-Side Entitlement Storage**: Premium status (`plan: 'premium'`) is written directly by the backend using Firebase Admin SDK to ensure clients cannot self-grant access.
- **Zero Secret Exposure**: The secret keys are never exposed in frontend code, client bundles, or Git repositories.

### Configuring Firebase Admin SDK on Render

To enable automatic server-side Firestore entitlement activation on your Render backend (`https://makehabit-twbz.onrender.com`):

1. Go to the [Firebase Console](https://console.firebase.google.com/) -> Project Settings -> **Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Open your [Render Dashboard](https://dashboard.render.com/) -> Navigate to your `makehabit-api` web service.
4. Go to **Environment** -> **Add Environment Variable**.
5. Add the variable:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Paste the raw JSON string of the downloaded service account key (or a base64-encoded string of it).
6. Click **Save Changes**. Render will automatically restart the service and initialize the Firebase Admin SDK.

### Transitioning to Razorpay Live Mode

When Razorpay activates and approves Live Mode for your account:
1. In your Render Dashboard, add:
   - `RAZORPAY_MODE`: `live`
   - `RAZORPAY_LIVE_KEY_ID`: Your live Razorpay Key ID (`rzp_live_...`)
   - `RAZORPAY_LIVE_KEY_SECRET`: Your live Razorpay Key Secret
2. The server will automatically switch to Live Mode and report `mode: "live"`, `paymentsLive: true` on `/api/razorpay/status`.
3. In GitHub Pages or local builds, set `VITE_RAZORPAY_KEY_ID` to your live key ID, or leave it blank to dynamically retrieve it from Render.

