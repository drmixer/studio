
"use client";

import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/shared/DarkModeToggle';
import { Menu, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const navItemsBase = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/contact', label: 'Contact Us' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  const navItems = user
    ? [...navItemsBase, { href: '/dashboard', label: 'Dashboard' }]
    : navItemsBase;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-2">
          {user ? (
            <Button variant="ghost" onClick={signOut} disabled={loading} className="hidden md:inline-flex">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Button asChild className="hidden md:inline-flex btn-gradient">
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
          <DarkModeToggle />
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading}>
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  {user ? (
                    <Button variant="outline" onClick={() => { signOut(); setMobileMenuOpen(false); }} className="w-full mt-4">
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                  ) : (
                    <Button asChild className="w-full btn-gradient mt-4">
                      <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
