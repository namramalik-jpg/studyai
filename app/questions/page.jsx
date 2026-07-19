import DashboardShell from "@/components/DashboardShell";
import QuestionList from "@/components/QuestionList";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Solved Questions",
  description: "Review questions solved with StudyAI.",
  path: "/questions",
});

export default function QuestionsPage() {
  return (
    <DashboardShell
      eyebrow="My Questions"
      title="Solved questions"
      description="Review questions you solved with StudyAI and open the full answer when needed."
    >
      <QuestionList />
    </DashboardShell>
  );
}
