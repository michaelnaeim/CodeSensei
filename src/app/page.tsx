import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features, Footer, HowItWorks, Pricing } from "@/components/landing/features";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}
