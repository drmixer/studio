
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface Project {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface User {
  id: string; // Firebase UID
  email: string | null;
  role: 'developer' | 'recruiter';
  githubProfileUrl?: string | null;
  projects?: Project[];
  skills?: string[];
  bio?: string;
  createdAt?: any; // Firestore Timestamp
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email_address: string, pass: string) => Promise<void>;
  signUp: (email_address: string, pass: string, role: 'developer' | 'recruiter') => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("AuthContext: useEffect for onAuthStateChanged is running.");
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("AuthContext: onAuthStateChanged triggered. fbUser:", fbUser ? fbUser.uid : null);
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        try {
          console.log(`AuthContext: Attempting to fetch Firestore document for user: ${fbUser.uid}`);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            console.log(`AuthContext: Firestore document found for UID: ${fbUser.uid}. Data:`, userDocSnap.data());
            const userData = { id: fbUser.uid, ...userDocSnap.data() } as User;
            setUser(userData);
            console.log("AuthContext: setUser called with user data:", userData);
          } else {
            console.warn(`AuthContext: User document NOT FOUND in Firestore for UID: ${fbUser.uid}. This may happen if the user was authenticated but their profile document wasn't created or was deleted. Signing out user.`);
            setUser(null);
            console.log("AuthContext: setUser called with null because Firestore doc not found.");
            await firebaseSignOut(auth); 
            console.log("AuthContext: firebaseSignOut called due to missing Firestore doc.");
          }
        } catch (docError: any) {
          console.error(`AuthContext: Firestore getDoc error for UID ${fbUser.uid}:`, docError.message, docError.code, docError.stack);
          console.error("AuthContext: Logging environment variables as seen by client during this error (AuthContext onAuthStateChanged):");
          console.error("   NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "MISSING!");
          console.error("   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "MISSING!");
          console.error("   NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "MISSING!");
          console.error("   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "MISSING!");
          console.error("   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "MISSING!");
          console.error("   NEXT_PUBLIC_FIREBASE_APP_ID:", process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "MISSING!");
          setError(`Failed to load user profile: ${docError.message}. Check Firestore rules and connectivity.`);
          setUser(null); 
          console.log("AuthContext: setUser called with null due to Firestore getDoc error.");
        }
      } else {
        console.log("AuthContext: No Firebase user (fbUser is null). Setting local user to null.");
        setUser(null);
        console.log("AuthContext: setUser called with null because fbUser is null.");
      }
      setLoading(false);
      console.log("AuthContext: setLoading(false). Current loading state:", false, "Current user state:", user);
    });

    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    }
  }, []); // Keep dependencies minimal, router is not needed here.

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    console.log("AuthContext: Attempting Firebase signInWithEmailAndPassword for email:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      console.log("AuthContext: Firebase signInWithEmailAndPassword successful. Firebase User UID:", userCredential.user.uid);
      // onAuthStateChanged will handle setting the user state and profile data.
      // We wait for loading to be false and user to be set by onAuthStateChanged before redirecting.
      // This is a common pattern but can be tricky. Let's log current context user before pushing.
      console.log("AuthContext (signIn): User state before router.push:", user);
      router.push('/dashboard');
    } catch (e: any) {
      console.error("AuthContext: Firebase SignIn Error:", e);
      setError(e.message || "Failed to sign in. Please check your credentials.");
    } finally {
      // setLoading(false) will be handled by onAuthStateChanged listener or if an error occurs here.
      // If signInWithEmailAndPassword fails, onAuthStateChanged might not fire immediately with the new user,
      // so ensure loading is handled. If it succeeds, onAuthStateChanged sets loading.
      if (error) { // if there was an error directly in signIn
           setLoading(false);
      }
      console.log("AuthContext: signIn function finished. Loading:", loading, "Error:", error);
    }
  };

  const signUp = async (email: string, pass: string, role: 'developer' | 'recruiter') => {
    setLoading(true);
    setError(null);
    console.log("AuthContext: Attempting Firebase signUp for email:", email, "Role:", role);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      console.log("AuthContext: Firebase createUserWithEmailAndPassword successful. UID:", fbUser.uid);
      
      const newUserProfile: User = {
        id: fbUser.uid,
        email: fbUser.email,
        role,
        githubProfileUrl: null,
        projects: [],
        skills: [],
        bio: '',
        createdAt: serverTimestamp(),
      };
      console.log("AuthContext: Attempting to set Firestore document for new user:", newUserProfile);
      await setDoc(doc(db, 'users', fbUser.uid), newUserProfile);
      console.log("AuthContext: Firestore document set for new user. Redirecting to dashboard.");
      // onAuthStateChanged will manage setting the user state.
      router.push('/dashboard');
    } catch (e: any) {
      console.error("AuthContext: Firebase SignUp Error:", e);
      setError(e.message || "Failed to sign up. Please try again.");
    } finally {
       if (error) { // if there was an error directly in signUp
           setLoading(false);
      }
      console.log("AuthContext: signUp function finished. Loading:", loading, "Error:", error);
    }
  };

  const signOut = async () => {
    console.log("AuthContext: Attempting Firebase signOut.");
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      console.log("AuthContext: Firebase signOut successful. Redirecting to /auth.");
      // setUser(null) will be handled by onAuthStateChanged
      router.push('/auth');
    } catch (e: any) { 
      console.error("AuthContext: Firebase signOut error:", e);
      setError(e.message || "Failed to sign out.");
    } finally {
      setLoading(false); // Explicitly set loading false here as onAuthStateChanged might be slower or not fire as expected on signout for redirects
      console.log("AuthContext: signOut function finished. Loading:", loading, "Error:", error);
    }
  };

  const updateUserProfile = async (updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>) => {
    if (firebaseUser) {
      console.log("AuthContext: Attempting to update user profile for UID:", firebaseUser.uid, "Updates:", updates);
      setLoading(true);
      setError(null);
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, updates);
        console.log("AuthContext: Firestore updateDoc successful.");
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
           const updatedUserData = { id: firebaseUser.uid, ...userDocSnap.data() } as User;
           setUser(updatedUserData);
           console.log("AuthContext: setUser called with updated profile data:", updatedUserData);
        } else {
          console.warn("AuthContext (updateUserProfile): User document not found after update. This is unexpected.");
        }
      } catch (e: any) {
        console.error("AuthContext: Firebase Update Profile Error:", e);
        setError(e.message || "Failed to update profile.");
      } finally {
        setLoading(false);
        console.log("AuthContext: updateUserProfile function finished. Loading:", loading, "Error:", error);
      }
    } else {
      console.error("AuthContext: No user logged in to update profile.");
      setError("No user logged in to update profile.");
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, error, signIn, signUp, signOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

