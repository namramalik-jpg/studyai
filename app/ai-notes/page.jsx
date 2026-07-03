import AINotesGenerator from "@/components/AINotesGenerator";
import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "AI Notes - StudyAI",
  description: "Generate Gemini-powered study notes and save them to StudyAI.",
};

export default function AINotesPage() {
  return (
    <DashboardShell
      eyebrow="AI Notes"
      title="AI Notes Generator"
      description="Turn any topic, chapter, or study prompt into structured notes with headings, key concepts, revision tips, and practice questions."
    >
      <AINotesGenerator />
    </DashboardShell>
  );
}
