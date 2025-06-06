
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
  
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    console.error(
      "CLIENT_SIDE firebase.ts: CRITICAL Firebase config values MISSING in firebaseConfig object (apiKey, projectId, or appId). " +
      "App will NOT connect to Firebase services correctly. Check .env.local and RESTART server. Values received:", 
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
}

// Server-side log
if (typeof window === 'undefined') {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
      "CRITICAL FIREBASE CONFIG MISSING (firebase.ts SERVER SIDE): NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined. " +
      "Check .env.local and RESTART server."
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

if (!getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) { // Added appId check for client
    try {
      app = initializeApp(firebaseConfig);
      if (typeof window === 'undefined') {
        console.log("SERVER_SIDE firebase.ts: Firebase app initialized successfully.");
      } else {
        console.log("CLIENT_SIDE firebase.ts: Firebase app initialized successfully.");
      }
    } catch (initError: any) {
      console.error("Firebase initialization error in firebase.ts:", initError.message, initError.code, initError.stack);
      if (typeof window !== 'undefined') {
        console.error("CLIENT_SIDE firebase.ts: Firebase config used during failed initialization:", firebaseConfig);
      } else {
        console.error("SERVER_SIDE firebase.ts: Firebase config used during failed initialization:", firebaseConfig);
      }
    }
  } else {
    const context = typeof window === 'undefined' ? "SERVER_SIDE" : "CLIENT_SIDE";
    console.error(`${context} firebase.ts: Firebase app NOT initialized due to missing critical config (apiKey, projectId, or appId).`);
  }
} else {
  app = getApps()[0];
   if (typeof window === 'undefined') {
    console.log("SERVER_SIDE firebase.ts: Firebase app already initialized, using existing instance.");
  } else {
    console.log("CLIENT_SIDE firebase.ts: Firebase app already initialized, using existing instance.");
  }
}

// @ts-ignore: app might be undefined if initialization failed
if (app) {
  auth = getAuth(app);
  db = getFirestore(app);
} else {
   const context = typeof window === 'undefined' ? "SERVER_SIDE" : "CLIENT_SIDE";
   console.error(`${context} firebase.ts: Firebase auth and db NOT initialized because app instance is missing.`);
  // @ts-ignore
  auth = undefined;
  // @ts-ignore
  db = undefined;
}


export { app, auth, db };

    