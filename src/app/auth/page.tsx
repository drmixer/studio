
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from 'next/navigation';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode');

  const [isSignUpMode, setIsSignUpMode] = useState(initialMode === 'signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'developer' | 'recruiter'>('developer');
  
  const { signIn, signUp, loading, error: authError } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSignUpMode) {
      await signUp(email, password, role);
    } else {
      await signIn(email, password);
    }
  };

  useEffect(() => {
    if (authError) {
      toast({
        title: "Authentication Error",
        description: authError,
        variant: "destructive",
      });
    }
  }, [authError, toast]);
  
  useEffect(() => {
    // Reset form fields when switching modes
    setEmail("");
    setPassword("");
    setRole("developer");
  }, [isSignUpMode]);

  return (
    <div className="min-h-[calc(100vh-theme(spacing.16)-theme(spacing.32))] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-secondary/30 to-background">
      <Card className="w-full max-w-md shadow-2xl overflow-hidden glassmorphic animate-fade-in">
        <div className="h-2 bg-gradient-to-r from-primary to-accent" />
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline text-gradient-primary">
            {isSignUpMode ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-foreground/80">
            {isSignUpMode ? "Join GitTalent today." : "Sign in to continue to GitTalent."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={isSignUpMode ? "new-password" : "current-password"}
              />
            </div>

            {isSignUpMode && (
              <div className="space-y-2">
                <Label>I am a...</Label>
                <RadioGroup 
                  value={role}
                  className="flex space-x-4"
                  onValueChange={(value: 'developer' | 'recruiter') => setRole(value)}
                  disabled={loading}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="developer" id="role-developer" />
                    <Label htmlFor="role-developer">Developer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="recruiter" id="role-recruiter" />
                    <Label htmlFor="role-recruiter">Recruiter</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            <Button type="submit" className="w-full btn-gradient shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {isSignUpMode ? "Sign Up" : "Sign In"}
            </Button>
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-border hover:bg-muted/50" disabled={loading}>
              <Github className="h-5 w-5" />
              Sign in with GitHub
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 text-sm">
          <p className="text-foreground/70">
            {isSignUpMode ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUpMode(!isSignUpMode)}
              className="font-medium text-primary hover:underline"
              disabled={loading}
            >
              {isSignUpMode ? "Sign In" : "Sign Up"}
            </button>
          </p>
          {!isSignUpMode && (
            <Link href="#" className="font-medium text-primary/80 hover:underline text-xs">
              Forgot your password?
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
