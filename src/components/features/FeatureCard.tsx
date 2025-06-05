"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ReactElement } from "react";
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: ReactElement;
  title: string;
  description: string;
  index: number;
}

export function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className={cn(
      "opacity-0 transform transition-all duration-500 ease-out",
      inView ? "animate-slide-up opacity-100" : "translate-y-8"
    )} style={{ animationDelay: `${index * 100}ms`}}>
      <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 group overflow-hidden border-transparent hover:border-primary/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-start space-x-4 p-6">
          <div className="p-3 bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-lg group-hover:scale-110 transition-transform duration-300">
            {React.cloneElement(icon, { className: "h-6 w-6" })}
          </div>
          <div>
            <CardTitle className="text-xl font-semibold mb-1 group-hover:text-gradient-primary">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <CardDescription className="text-foreground/80 text-sm">{description}</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
