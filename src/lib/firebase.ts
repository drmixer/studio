
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
  console.log("CLIENT_SIDE firebase.ts: Firebase config being used for initializeApp:", firebaseConfig);
}

// Server-side log (already existed, kept for verification)
if (typeof window === 'undefined') {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
      "CRITICAL FIREBASE CONFIG MISSING (firebase.ts SERVER SIDE): NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined. " +
      "Check .env.local and RESTART server."
    );
    console.error("SERVER_SIDE firebase.ts: Values seen at startup:", {
      apiKey: firebaseConfig.apiKey ? 'Loaded' : 'MISSING!',
      authDomain: firebaseConfig.authDomain ? 'Loaded' : 'MISSING!',
      projectId: firebaseConfig.projectId ? 'Loaded' : 'MISSING!',
      storageBucket: firebaseConfig.storageBucket ? 'Loaded' : 'MISSING!',
      messagingSenderId: firebaseConfig.messagingSenderId ? 'Loaded' : 'MISSING!',
      appId: firebaseConfig.appId ? 'Loaded' : 'MISSING!',
    });
  }
}


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      app = initializeApp(firebaseConfig);
      if (typeof window === 'undefined') {
        console.log("SERVER_SIDE firebase.ts: Firebase app initialized successfully.");
      }
    } catch (initError: any) {
      console.error("Firebase initialization error in firebase.ts:", initError.message, initError.code, initError.stack);
      console.error("Firebase config used during failed initialization in firebase.ts:", firebaseConfig);
    }
  } else {
    if (typeof window === 'undefined') {
      console.error("SERVER_SIDE firebase.ts: Firebase app NOT initialized due to missing critical config.");
    } else {
      console.error("CLIENT_SIDE firebase.ts: Firebase app NOT initialized due to missing critical config in browser environment vars:", firebaseConfig);
    }
  }
} else {
  app = getApps()[0];
   if (typeof window === 'undefined') {
    console.log("SERVER_SIDE firebase.ts: Firebase app already initialized, using existing instance.");
  }
}

// @ts-ignore: app might be undefined
if (app) {
  auth = getAuth(app);
  db = getFirestore(app);
} else {
   if (typeof window === 'undefined') {
    console.error("SERVER_SIDE firebase.ts: Firebase auth and db NOT initialized because app instance is missing.");
   } else {
    console.error("CLIENT_SIDE firebase.ts: Firebase auth and db NOT initialized because app instance is missing. Config used:", firebaseConfig);
   }
  // @ts-ignore
  auth = undefined;
  // @ts-ignore
  db = undefined;
}


export { app, auth, db };
