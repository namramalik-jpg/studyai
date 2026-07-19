import AISummaryGenerator from "@/components/AISummaryGenerator";
import DashboardShell from "@/components/DashboardShell";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "AI Summary",
  description: "Summarize long study material with Gemini-powered AI.",
  path: "/ai-summary",
});

export default function AISummaryPage() {
  return (
    <DashboardShell
      eyebrow="AI Summary"
      title="AI Summary Generator"
      description="Paste long study material and get an exam-ready summary with key points, definitions, formulas, revision tips, and exam tips."
    >
      <AISummaryGenerator />
    </DashboardShell>
  );
}
