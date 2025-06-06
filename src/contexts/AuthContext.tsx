
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        try {
          console.log(`AuthContext: Attempting to fetch Firestore document for user: ${fbUser.uid}`);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUser({ id: fbUser.uid, ...userDocSnap.data() } as User);
            console.log(`AuthContext: Successfully fetched profile for user: ${fbUser.uid}`);
          } else {
            console.warn(`AuthContext: User document not found in Firestore for UID: ${fbUser.uid}. This may happen if the user was authenticated but their profile document wasn't created or was deleted. Signing out user.`);
            setUser(null); 
            await firebaseSignOut(auth); 
          }
        } catch (docError: any) {
          console.error(`AuthContext: Firestore getDoc error for UID ${fbUser.uid}:`, docError.message, docError.code, docError.stack);
          console.error("AuthContext: Current Firebase config status during getDoc error:", {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Loaded' : 'MISSING!',
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Loaded' : 'MISSING!',
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Loaded' : 'MISSING!',
          });
          setError(`Failed to load user profile: ${docError.message}. This can be due to network issues, incorrect Firebase setup (check .env.local and restart server), or Firestore rules. Check browser console for details.`);
          setUser(null); 
          // Consider if auto sign-out is desired here or if user should see a persistent error state.
          // For now, setting user to null and showing error.
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/dashboard');
    } catch (e: any) {
      console.error("Firebase SignIn Error:", e);
      setError(e.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, role: 'developer' | 'recruiter') => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      
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
      await setDoc(doc(db, 'users', fbUser.uid), newUserProfile);
      router.push('/dashboard');
    } catch (e: any) {
      console.error("Firebase SignUp Error:", e);
      setError(e.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      router.push('/auth');
    } catch (e: any) {
      setError(e.message || "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>) => {
    if (firebaseUser) {
      setLoading(true);
      setError(null);
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, updates);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
           setUser({ id: firebaseUser.uid, ...userDocSnap.data() } as User);
        }
      } catch (e: any) {
        console.error("Firebase Update Profile Error:", e);
        setError(e.message || "Failed to update profile.");
      } finally {
        setLoading(false);
      }
    } else {
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

