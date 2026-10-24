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

## Razorpay Payment Integration

MakeHabit includes an integration for a proposed **₹199 one-time Lifetime Premium** tier:
- **Order Creation**: The client calls `POST /api/razorpay/create-order` on the Render backend. The server communicates with Razorpay APIs via Basic Auth using `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to create an order of exactly 19,900 paise (₹199.00 INR).
- **HMAC-SHA256 Verification**: Upon payment completion in the Razorpay Checkout modal, the payment signature is verified server-side (`POST /api/razorpay/verify-payment`) using HMAC-SHA256 and constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
- **Zero Secret Exposure**: The secret key is never referenced, imported, or accessible in frontend code or Git history.
