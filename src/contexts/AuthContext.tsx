
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
        // User is signed in, fetch their profile from Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUser({ id: fbUser.uid, ...userDocSnap.data() } as User);
        } else {
          // This case should ideally not happen if signUp creates a doc
          // Or, it could be a user authenticated through other means without a profile yet
          console.warn("User document not found in Firestore for UID:", fbUser.uid);
          // You might want to create a default profile here or sign them out
          // For now, let's set a minimal user or sign out
           setUser(null); // Or handle more gracefully
           await firebaseSignOut(auth); // Sign out if profile is missing
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting the user and redirecting
      // No need to fetch user doc here, onAuthStateChanged handles it.
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
      
      // Create user document in Firestore
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
      // onAuthStateChanged will handle setting the user
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
      // onAuthStateChanged will set user to null
      router.push('/auth');
    } catch (e: any) { // Added missing opening curly brace here
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
        // Optimistically update local state or re-fetch for consistency
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

