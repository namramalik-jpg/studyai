import DashboardShell from "@/components/DashboardShell";
import SettingsPageClient from "@/components/SettingsPageClient";

export const metadata = {
  title: "Settings - StudyAI",
  description: "Manage your StudyAI account, appearance, privacy, and security settings.",
};

export default function SettingsPage() {
  return (
    <DashboardShell
      eyebrow="Settings"
      title="Workspace settings"
      description="Manage your StudyAI account, preferences, privacy, and security from one place."
    >
      <SettingsPageClient />
    </DashboardShell>
  );
}
