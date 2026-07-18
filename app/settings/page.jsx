import DashboardShell from "@/components/DashboardShell";
import SettingsPageClient from "@/components/SettingsPageClient";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Settings",
  description: "Manage your StudyAI account, appearance, privacy, and security settings.",
  path: "/settings",
});

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
