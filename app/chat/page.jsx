import AIChatPageClient from "@/components/AIChatPageClient";
import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "AI Chat - StudyAI",
  description: "Chat with StudyAI and save your conversations securely.",
};

export default function ChatPage() {
  return (
    <DashboardShell
      eyebrow="AI Chat"
      title="StudyAI Chat"
      description="Ask follow-up questions, explore concepts, and keep every study conversation organized."
    >
      <AIChatPageClient />
    </DashboardShell>
  );
}
