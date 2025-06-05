import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureOverviewSection } from "@/components/landing/FeatureOverviewSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FaqSection } from "@/components/landing/FaqSection";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <FeatureOverviewSection />
      <BenefitsSection />
      <TestimonialsSection />
      <FaqSection />
    </div>
  );
}
