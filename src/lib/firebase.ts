
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

// Client-side specific log
if (typeof window !== 'undefined') {
  console.log("CLIENT_SIDE firebase.ts: Firebase config values from process.env before initializeApp:");
  console.log("  NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "MISSING!");
  console.log("  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "MISSING!");
  console.log("  NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "MISSING!");
  console.log("  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "MISSING!");
  console.log("  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "MISSING!");
  console.log("  NEXT_PUBLIC_FIREBASE_APP_ID:", process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "MISSING!");
  
  const allCriticalEnvVarsPresent = 
    firebaseConfig.apiKey && 
    firebaseConfig.authDomain &&
    firebaseConfig.projectId && 
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId;

  if (!allCriticalEnvVarsPresent) {
    console.error(
      "CLIENT_SIDE firebase.ts: CRITICAL Firebase config values MISSING in firebaseConfig object. " +
      "App will NOT connect to Firebase services correctly. Check .env.local and RESTART server/preview. Values received:", 
      {
        apiKey: firebaseConfig.apiKey ? 'Loaded' : 'MISSING!',
        authDomain: firebaseConfig.authDomain ? 'Loaded' : 'MISSING!',
        projectId: firebaseConfig.projectId ? 'Loaded' : 'MISSING!',
        storageBucket: firebaseConfig.storageBucket ? 'Loaded' : 'MISSING!',
        messagingSenderId: firebaseConfig.messagingSenderId ? 'Loaded' : 'MISSING!',
        appId: firebaseConfig.appId ? 'Loaded' : 'MISSING!',
      }
    );
  } else {
    console.log("CLIENT_SIDE firebase.ts: All critical Firebase config values appear to be present in firebaseConfig object for client-side initialization.");
  }
  console.log("CLIENT_SIDE firebase.ts: Firebase config being used for initializeApp:", firebaseConfig);
}

// Server-side log
if (typeof window === 'undefined') {
  const allCriticalServerEnvVarsPresent = 
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId;

  if (!allCriticalServerEnvVarsPresent) {
    console.error(
      "CRITICAL FIREBASE CONFIG MISSING (firebase.ts SERVER SIDE): One or more NEXT_PUBLIC_FIREBASE_... variables are not defined. " +
      "Check .env.local and RESTART server/preview."
    );
  }
  console.log("SERVER_SIDE firebase.ts: Firebase config values as seen by server:", {
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

const DATABASE_ID = "gittalent"; // Specify the database ID from your screenshot

if (!getApps().length) {
  const canInitialize = 
    firebaseConfig.apiKey && 
    firebaseConfig.authDomain &&
    firebaseConfig.projectId && 
    // storageBucket is not strictly critical for Firestore/Auth init but good to have
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId;

  if (canInitialize) {
    try {
      app = initializeApp(firebaseConfig);
      if (typeof window === 'undefined') {
        console.log("SERVER_SIDE firebase.ts: Firebase app initialized successfully.");
      } else {
        console.log("CLIENT_SIDE firebase.ts: Firebase app initialized successfully.");
      }
    } catch (initError: any) {
      const context = typeof window === 'undefined' ? "SERVER_SIDE" : "CLIENT_SIDE";
      console.error(`${context} firebase.ts: Firebase initialization error:`, initError.message, initError.code, initError.stack);
      console.error(`${context} firebase.ts: Firebase config used during failed initialization:`, firebaseConfig);
      // @ts-ignore: app will be undefined here
      app = undefined; 
    }
  } else {
    const context = typeof window === 'undefined' ? "SERVER_SIDE" : "CLIENT_SIDE";
    console.error(`${context} firebase.ts: Firebase app NOT initialized due to missing critical config (apiKey, projectId, appId, authDomain, or messagingSenderId).`);
    // @ts-ignore: app will be undefined here
    app = undefined;
  }
} else {
  app = getApps()[0];
   if (typeof window === 'undefined') {
    console.log("SERVER_SIDE firebase.ts: Firebase app already initialized, using existing instance.");
  } else {
    console.log("CLIENT_SIDE firebase.ts: Firebase app already initialized, using existing instance.");
  }
}

if (app) {
  auth = getAuth(app);
  // Connect to the specified database ID
  db = getFirestore(app, DATABASE_ID); 
  console.log(`Firebase: Attempting to connect to Firestore database with ID: "${DATABASE_ID}"`);
} else {
   const context = typeof window === 'undefined' ? "SERVER_SIDE" : "CLIENT_SIDE";
   console.error(`${context} firebase.ts: Firebase auth and db NOT initialized because app instance is missing.`);
  // @ts-ignore
  auth = undefined;
  // @ts-ignore
  db = undefined;
}

export { app, auth, db };
