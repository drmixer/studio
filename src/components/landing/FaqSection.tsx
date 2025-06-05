"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: "What is GitTalent?",
    answer: "GitTalent is a hiring platform that connects companies with top software developers by leveraging insights from their GitHub profiles and utilizing AI-powered matching tools.",
  },
  {
    question: "How does the AI candidate shortlisting work?",
    answer: "Our AI analyzes candidates' GitHub activity, including repositories, contributions, and tech stack, to identify and rank the most suitable developers for your specific job requirements.",
  },
  {
    question: "Is GitTalent suitable for both startups and large enterprises?",
    answer: "Yes! GitTalent is designed to scale with your needs. Whether you're hiring your first developer or building out a large engineering team, our platform provides the tools to find the right talent.",
  },
  {
    question: "How is developer data sourced and kept up-to-date?",
    answer: "We integrate directly with the GitHub API to ensure that developer profiles and activity data are current and accurate, providing you with the latest insights.",
  },
  {
    question: "Can I integrate GitTalent with my existing ATS?",
    answer: "We are actively working on integrations with popular Applicant Tracking Systems. Please contact us to discuss your specific ATS needs."
  }
];

export function FaqSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  return (
    <section ref={ref} className={cn("py-16 md:py-24 bg-secondary/30", inView ? "animate-fade-in" : "opacity-0")}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
            Frequently Asked <span className="text-gradient-primary">Questions</span>
          </h2>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <AccordionTrigger className="p-6 text-left text-lg font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0 text-foreground/80">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
