import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import ImpactStats from '@/components/landing/ImpactStats';
import CTASection from '@/components/landing/CTASection';

export default function LandingPage() {
  return (
    <main className="bg-base min-h-screen">
      <Hero />
      <HowItWorks />
      <ImpactStats />
      <CTASection />
    </main>
  );
}
