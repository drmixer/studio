"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Users, Search, Target, MessageSquare, CalendarCheck, Zap } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: <Github className="h-8 w-8 text-primary" />,
    title: "GitHub Profile Integration",
    description: "Deep dive into developer profiles, contributions, and project histories.",
    aiHint: "code repository"
  },
  {
    icon: <Search className="h-8 w-8 text-primary" />,
    title: "AI Candidate Shortlisting",
    description: "Smart algorithms identify top candidates based on your specific needs.",
    aiHint: "artificial intelligence"
  },
  {
    icon: <Target className="h-8 w-8 text-primary" />,
    title: "Tech Stack Matching",
    description: "Automatically tag and match candidates by their precise technical skills.",
    aiHint: "skills technology"
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Streamlined Workflows",
    description: "Manage your entire hiring pipeline, from outreach to offer, in one place.",
    aiHint: "process efficiency"
  },
];

export function FeatureOverviewSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
            Powerful Tools, <span className="text-gradient-primary">Effortless Hiring</span>
          </h2>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Discover the features that make GitTalent the ultimate platform for sourcing and hiring developers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className={cn(
      "opacity-0 transform transition-all duration-700 ease-out",
      inView ? "animate-slide-up opacity-100" : "translate-y-10"
    )} style={{ animationDelay: `${index * 150}ms`}}>
      <Card className="h-full hover:shadow-xl transition-shadow duration-300 group overflow-hidden">
        <CardHeader className="items-center text-center">
          <div className="p-4 bg-primary/10 rounded-lg mb-4 inline-block group-hover:scale-110 transition-transform duration-300">
            {feature.icon}
          </div>
          <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">{feature.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-foreground/70">{feature.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
