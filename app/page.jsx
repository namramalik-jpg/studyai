import AIDemo from "@/components/AIDemo";
import AIWorkspaceShowcase from "@/components/AIWorkspaceShowcase";
import FAQ from "@/components/FAQ";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Navbar from "@/components/Navbar";
import StatsSection from "@/components/StatsSection";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background pt-[72px]">
      <Navbar />
      <Hero />
      <StatsSection />
      <AIWorkspaceShowcase />
      <AIDemo />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
