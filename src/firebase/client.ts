import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True once every required env var has been filled in (see .env.example). */
export const isFirebaseConfigured = Object.values(config).every((v) => Boolean(v));

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(config);
  authInstance = getAuth(app);
  // Many optional fields (colors, background images, style overrides) are cleared by setting
  // them to `undefined` rather than deleting the key — without this setting Firestore rejects
  // the whole write outright whenever that happens (e.g. clearing a color swatch).
  dbInstance = initializeFirestore(app, { ignoreUndefinedProperties: true });
  storageInstance = getStorage(app);
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) throw new Error('Firebase is not configured — see .env.example');
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) throw new Error('Firebase is not configured — see .env.example');
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) throw new Error('Firebase is not configured — see .env.example');
  return storageInstance;
}
