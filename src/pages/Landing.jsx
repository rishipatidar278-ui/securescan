import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import HeroSection from "@/components/landing/HeroSection";
import ChecksSection from "@/components/landing/ChecksSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ReportSection from "@/components/landing/ReportSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaSection from "@/components/landing/CtaSection";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <HeroSection />
        <ChecksSection />
        <HowItWorksSection />
        <ReportSection />
        <FaqSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}