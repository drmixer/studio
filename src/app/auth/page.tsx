import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  return (
    <div className="min-h-[calc(100vh-theme(spacing.16)-theme(spacing.32))] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-secondary/30 to-background">
      <Card className="w-full max-w-md shadow-2xl overflow-hidden glassmorphic animate-fade-in">
        <div className="h-2 bg-gradient-to-r from-primary to-accent" />
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline text-gradient-primary">Welcome to GitTalent</CardTitle>
          <CardDescription className="text-foreground/80">
            Sign in or create an account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full btn-gradient shadow-md hover:shadow-lg transition-shadow">
            Sign In
          </Button>
          <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-border hover:bg-muted/50">
            <Github className="h-5 w-5" />
            Sign in with GitHub
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 text-sm">
          <p className="text-foreground/70">
            Don&apos;t have an account?{" "}
            <Link href="#" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
          <Link href="#" className="font-medium text-primary/80 hover:underline text-xs">
            Forgot your password?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
