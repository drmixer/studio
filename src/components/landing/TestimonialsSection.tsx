"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    name: "Sarah L., Lead Engineer @ TechCorp",
    avatar: "https://placehold.co/100x100.png",
    aiHint: "woman portrait",
    quote: "GitTalent revolutionized how we find niche developers. The GitHub insights are invaluable, and we've hired three amazing engineers through the platform!",
    rating: 5,
  },
  {
    name: "John B., CTO @ InnovateSolutions",
    avatar: "https://placehold.co/100x100.png",
    aiHint: "man portrait",
    quote: "The AI shortlisting feature saved us countless hours. We're now connecting with highly relevant candidates much faster.",
    rating: 5,
  },
  {
    name: "Emily W., Developer Advocate",
    avatar: "https://placehold.co/100x100.png",
    aiHint: "person smiling",
    quote: "As a developer, I appreciate that GitTalent focuses on actual work. It's refreshing to be seen for my code, not just keywords on a resume.",
    rating: 4,
  },
];

export function TestimonialsSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section ref={ref} className={cn("py-16 md:py-24 bg-background", inView ? "animate-fade-in" : "opacity-0")}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
            Loved by <span className="text-gradient-primary">Developers & Recruiters</span>
          </h2>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Hear what our users are saying about their experience with GitTalent.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1 overflow-hidden glassmorphic">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.aiHint} />
                    <AvatarFallback>{testimonial.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <div className="flex text-yellow-400">
                      {[...Array(testimonial.rating)].map((_, i) => <Star key={i} fill="currentColor" className="h-4 w-4" />)}
                      {[...Array(5 - testimonial.rating)].map((_, i) => <Star key={i} className="h-4 w-4" />)}
                    </div>
                  </div>
                </div>
                <blockquote className="text-foreground/80 italic">
                  "{testimonial.quote}"
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
