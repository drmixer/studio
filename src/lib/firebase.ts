
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log a warning if essential config values are missing
// This log will appear in the SERVER terminal during Next.js startup
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "CRITICAL FIREBASE CONFIG MISSING (firebase.ts): NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined in your environment variables. " +
    "This check is happening in src/lib/firebase.ts during app initialization. " +
    "Ensure your .env.local file is correctly set up in the project root with all necessary Firebase project credentials, " +
    "and that you have RESTARTED your development server after creating or modifying this file."
  );
  console.error("Values seen by firebase.ts at startup:", {
    apiKey: firebaseConfig.apiKey ? 'Loaded' : 'MISSING!',
    authDomain: firebaseConfig.authDomain ? 'Loaded' : 'MISSING!',
    projectId: firebaseConfig.projectId ? 'Loaded' : 'MISSING!',
    storageBucket: firebaseConfig.storageBucket ? 'Loaded' : 'MISSING!',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'Loaded' : 'MISSING!',
    appId: firebaseConfig.appId ? 'Loaded' : 'MISSING!',
  });
}


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Check if apps are already initialized to prevent re-initialization error
if (!getApps().length) {
  // Only initialize if no apps exist AND if essential config is present
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully in firebase.ts.");
    } catch (initError: any) {
      console.error("Firebase initialization error in firebase.ts:", initError.message, initError.code, initError.stack);
      console.error("Firebase config used during failed initialization in firebase.ts:", firebaseConfig);
    }
  } else {
    // If essential config is missing, we can't initialize.
    // The previous console.error already warned about this.
    console.error("Firebase app NOT initialized in firebase.ts due to missing critical config.");
  }
} else {
  app = getApps()[0];
  console.log("Firebase app already initialized, using existing instance from firebase.ts.");
}

// Assign auth and db regardless of new/existing app, but only if app was successfully initialized/retrieved
// @ts-ignore: app might be undefined if init failed due to missing config
if (app) {
  auth = getAuth(app);
  db = getFirestore(app);
} else {
   console.error("Firebase auth and db NOT initialized in firebase.ts because app instance is missing (likely due to config issues).");
  // @ts-ignore
  auth = undefined;
  // @ts-ignore
  db = undefined;
}


export { app, auth, db };
