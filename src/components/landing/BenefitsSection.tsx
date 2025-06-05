"use client";
import Image from "next/image";
import { CheckCircle } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

const developerBenefits = [
  "Showcase your real-world projects",
  "Get discovered for your unique skills",
  "Connect with innovative companies",
  "Fair evaluation based on contributions",
];

const recruiterBenefits = [
  "Access a pool of verified developers",
  "Save time with AI-powered shortlisting",
  "Understand candidate skills deeply",
  "Streamline your hiring process",
];

export function BenefitsSection() {
  const { ref: devRef, inView: devInView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const { ref: recRef, inView: recInView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section className="py-16 md:py-24 bg-secondary/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div ref={devRef} className={cn("space-y-6 opacity-0", devInView && "animate-slide-up")}>
            <h2 className="text-3xl font-bold font-headline text-gradient-primary">For Developers</h2>
            <p className="text-lg text-foreground/80">
              Stop grinding LeetCode. Let your GitHub profile speak for itself and find roles that truly match your passion and expertise.
            </p>
            <ul className="space-y-3">
              {developerBenefits.map((benefit, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-foreground/90">{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-lg overflow-hidden shadow-lg">
              <Image 
                src="https://placehold.co/600x400.png" 
                alt="Developer working on code" 
                width={600} 
                height={400}
                className="w-full h-auto"
                data-ai-hint="developer coding" 
              />
            </div>
          </div>

          <div ref={recRef} className={cn("space-y-6 opacity-0", recInView && "animate-slide-up animation-delay-300")} style={{animationDelay: recInView ? '0.3s' : '0s'}}>
            <h2 className="text-3xl font-bold font-headline text-gradient-primary">For Recruiters</h2>
            <p className="text-lg text-foreground/80">
              Move beyond resumes. Identify and engage top-tier developers based on their actual coding activity and project portfolios.
            </p>
            <ul className="space-y-3">
              {recruiterBenefits.map((benefit, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-foreground/90">{benefit}</span>
                </li>
              ))}
            </ul>
             <div className="mt-6 rounded-lg overflow-hidden shadow-lg">
              <Image 
                src="https://placehold.co/600x400.png" 
                alt="Recruiter reviewing profiles" 
                width={600} 
                height={400}
                className="w-full h-auto"
                data-ai-hint="recruiter dashboard"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
