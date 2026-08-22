import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Firebase's client config is not secret (it's shipped to every browser by
// design) — only the Admin SDK service account, used server-side, is.
const config = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(config).every((v) => Boolean(v));

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured — see .env.example');
  if (!authInstance) {
    app = getApps()[0] ?? initializeApp(config);
    authInstance = getAuth(app);
  }
  return authInstance;
}
