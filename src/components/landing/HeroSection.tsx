"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary via-blue-600 to-accent text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {/* Subtle background pattern or texture if desired */}
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-headline mb-6 animate-fade-in drop-shadow-lg">
          Recruiting top talent.
          <br />
          <span className="opacity-90">One commit at a time.</span>
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-slide-up opacity-0 animation-delay-300 drop-shadow-sm">
          GitTalent leverages GitHub insights and AI to help you discover, vet, and hire exceptional software developers faster than ever.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 animate-slide-up opacity-0 animation-delay-600">
          <Button size="lg" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Link href="/contact">Request Access</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Link href="#features">See How It Works</Link>
          </Button>
        </div>
        <div className="mt-16 animate-fade-in opacity-0 animation-delay-900">
          <Image 
            src="https://placehold.co/800x400.png" 
            alt="GitTalent Platform Showcase" 
            width={800} 
            height={400} 
            className="rounded-lg shadow-2xl mx-auto"
            data-ai-hint="dashboard hiring"
          />
        </div>
      </div>
      <style jsx>{`
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-900 { animation-delay: 0.9s; }
      `}</style>
    </section>
  );
}
