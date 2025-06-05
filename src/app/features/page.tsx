import { FeatureCard } from "@/components/features/FeatureCard";
import { Github, Users, Layers, Zap, Search, MessageCircle, CalendarDays, BarChart3, Settings, Briefcase } from "lucide-react";
import Image from "next/image";

const developerFeatures = [
  {
    icon: <Github />,
    title: "GitHub Profile Integration",
    description: "Connect your GitHub to showcase verified contributions, popular repositories, and overall coding activity.",
  },
  {
    icon: <BarChart3 />,
    title: "Code Contribution Signals",
    description: "Highlight your impact with metrics on commit frequency, code complexity, and collaboration patterns.",
  },
  {
    icon: <Layers />,
    title: "Tech Stack Tagging",
    description: "Automatically identify and tag your skills based on repository languages, frameworks, and libraries.",
  },
  {
    icon: <Briefcase />,
    title: "Project Portfolio Snapshots",
    description: "Curate and present your best projects with rich media and detailed descriptions.",
  },
  {
    icon: <Zap />,
    title: "Optional Code Assessments",
    description: "Demonstrate your skills through practical coding challenges relevant to your desired roles (optional).",
  },
];

const recruiterFeatures = [
  {
    icon: <Search />,
    title: "AI Candidate Shortlisting",
    description: "Our intelligent algorithms analyze GitHub data to surface the most relevant candidates for your roles.",
  },
  {
    icon: <MessageCircle />,
    title: "Smart Outreach Tools",
    description: "Personalize communication with candidates using insights from their profiles and activity.",
  },
  {
    icon: <CalendarDays />,
    title: "Integrated Scheduling",
    description: "Seamlessly schedule interviews and manage your hiring calendar within the platform.",
  },
  {
    icon: <Users />,
    title: "Talent CRM",
    description: "Build and nurture your talent pipeline with easy-to-use candidate relationship management tools.",
  },
  {
    icon: <Settings />,
    title: "ATS Integrations (Mock)",
    description: "Connect GitTalent with your existing Applicant Tracking System for a unified workflow (coming soon).",
  },
];

export default function FeaturesPage() {
  return (
    <div className="py-12 md:py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline mb-4">
            Unlock Your <span className="text-gradient-primary">Hiring Potential</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto">
            GitTalent offers a comprehensive suite of tools designed to empower both developers and recruiters in the modern tech landscape.
          </p>
        </header>

        <section className="mb-16 md:mb-24">
          <div className="flex flex-col md:flex-row items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4 md:mb-0">
              <span className="text-gradient-primary">Developer-Focused</span> Tools
            </h2>
            <Users className="h-12 w-12 text-accent hidden md:block" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {developerFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
           <div className="mt-12 rounded-xl overflow-hidden shadow-2xl">
              <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Developer tools interface" 
                width={1200} 
                height={400}
                className="w-full h-auto"
                data-ai-hint="developer dashboard interface"
              />
            </div>
        </section>

        <section>
          <div className="flex flex-col md:flex-row items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4 md:mb-0">
              Streamlined <span className="text-gradient-primary">Recruiting Workflows</span>
            </h2>
             <Briefcase className="h-12 w-12 text-accent hidden md:block" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {recruiterFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
          <div className="mt-12 rounded-xl overflow-hidden shadow-2xl">
              <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Recruiter workflow interface" 
                width={1200} 
                height={400}
                className="w-full h-auto"
                data-ai-hint="recruiter tools analytics"
              />
            </div>
        </section>
      </div>
    </div>
  );
}
