import AIChatPageClient from "@/components/AIChatPageClient";
import DashboardShell from "@/components/DashboardShell";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "AI Chat",
  description: "Chat with StudyAI and save your conversations securely.",
  path: "/chat",
});

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
