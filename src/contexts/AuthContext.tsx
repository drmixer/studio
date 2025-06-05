
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface User {
  id: string;
  email: string | null;
  role: 'developer' | 'recruiter';
  githubProfileUrl?: string | null;
  projects?: Project[];
  skills?: string[];
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email_address: string, pass: string) => Promise<void>;
  signUp: (email_address: string, pass: string, role: 'developer' | 'recruiter') => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('gittalent-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('gittalent-user');
    }
    setLoading(false);
    setInitialLoad(false);
  }, []);

  const signIn = async (email: string, _pass: string) => {
    setLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === "user@example.com" || email === "dev@example.com" || email === "rec@example.com") {
      const mockUser: User = {
        id: 'mock-user-id-' + email.split('@')[0],
        email,
        role: email === "rec@example.com" ? 'recruiter' : 'developer',
        githubProfileUrl: email === "dev@example.com" ? "https://github.com/mockdev" : null,
        projects: email === "dev@example.com" ? [{id: '1', title: 'My Awesome Project', url: 'https://github.com/mockdev/awesome', description: 'This is a cool project.'}] : [],
        skills: email === "dev@example.com" ? ['React', 'TypeScript', 'Node.js'] : [],
        bio: email === "dev@example.com" ? 'Passionate developer building cool things.' : '',
      };
      setUser(mockUser);
      localStorage.setItem('gittalent-user', JSON.stringify(mockUser));
      router.push('/dashboard');
    } else {
      setError("Invalid email or password.");
    }
    setLoading(false);
  };

  const signUp = async (email: string, _pass: string, role: 'developer' | 'recruiter') => {
    setLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newUser: User = {
      id: 'new-user-' + Date.now(),
      email,
      role,
      githubProfileUrl: null,
      projects: [],
      skills: [],
      bio: '',
    };
    setUser(newUser);
    localStorage.setItem('gittalent-user', JSON.stringify(newUser));
    router.push('/dashboard');
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    localStorage.removeItem('gittalent-user');
    router.push('/auth');
    setLoading(false);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (user) {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('gittalent-user', JSON.stringify(updatedUser));
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading: loading || initialLoad, error, signIn, signUp, signOut, updateUserProfile }}>
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
