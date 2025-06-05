
"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-background via-transparent to-transparent text-foreground overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-gradient-to-tr from-primary/30 via-transparent to-accent/30" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-headline mb-6 animate-fade-in drop-shadow-lg text-foreground">
          Recruiting <span className="text-gradient-primary">top talent</span>.
          <br />
          <span className="opacity-90">One <span className="text-gradient-primary">commit</span> at a time.</span>
        </h1>
        <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-10 animate-slide-up opacity-0 animation-delay-300 drop-shadow-sm">
          GitTalent leverages GitHub insights and AI to help you discover, vet, and hire exceptional software developers faster than ever.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 animate-slide-up opacity-0 animation-delay-600">
          <Button size="lg" asChild className="btn-gradient shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Link href="/auth?mode=signup">Request Access</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="shadow-lg transform hover:scale-105 transition-transform duration-300 bg-background/70 hover:bg-background border-border hover:border-primary/50">
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
        .dark .text-gradient-primary {
           background-image: linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)));
        }
      `}</style>
    </section>
  );
}
