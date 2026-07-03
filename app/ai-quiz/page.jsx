import AIQuizGenerator from "@/components/AIQuizGenerator";
import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "AI Quiz - StudyAI",
  description: "Generate interactive Gemini-powered quizzes from any topic or notes.",
};

export default function AIQuizPage() {
  return (
    <DashboardShell
      eyebrow="AI Quiz"
      title="AI Quiz Generator"
      description="Create multiple-choice quizzes from any study topic or pasted notes, answer one question at a time, and save your result."
    >
      <AIQuizGenerator />
    </DashboardShell>
  );
}
