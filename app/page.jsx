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
import {
  absoluteUrl,
  defaultDescription,
  defaultTitle,
  jsonLd,
  siteName,
  siteUrl,
} from "@/lib/seo";

const homepageFaqs = [
  {
    question: "How does StudyAI work?",
    answer:
      "Enter a topic, paste study material, or ask a question. StudyAI uses AI to generate clear notes, summaries, explanations, quizzes, and practice material in seconds.",
  },
  {
    question: "Is StudyAI free?",
    answer:
      "Yes. Students can start with StudyAI for free and quickly try AI notes, summaries, quizzes, flashcards, and question solving.",
  },
  {
    question: "Can StudyAI create quizzes and flashcards?",
    answer:
      "Yes. StudyAI can turn topics and pasted notes into quiz-style practice questions and interactive flashcards for revision.",
  },
  {
    question: "Can StudyAI help with exam revision?",
    answer:
      "Yes. StudyAI helps organize key ideas, definitions, formulas, summaries, and practice questions so students can review faster before exams.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteName,
    url: siteUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: defaultDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AI notes generator",
      "AI summary generator",
      "AI quiz generator",
      "AI flashcards",
      "Question solver",
      "Saved study workspace",
    ],
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
      logo: absoluteUrl("/icon.svg"),
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl("/icon.svg"),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homepageFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
];

export const metadata = {
  title: {
    absolute: defaultTitle,
  },
  description: defaultDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: "/",
    siteName,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "StudyAI AI study workspace for notes, summaries, quizzes, and flashcards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/twitter-image"],
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
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
    </>
  );
}
