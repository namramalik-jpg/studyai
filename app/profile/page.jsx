import DashboardShell from "@/components/DashboardShell";
import ProfilePageClient from "@/components/ProfilePageClient";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Profile",
  description: "Manage your StudyAI profile and account details.",
  path: "/profile",
});

export default function ProfilePage() {
  return (
    <DashboardShell
      eyebrow="Profile"
      title="Your StudyAI profile"
      description="Manage your account details, profile picture, and AI learning activity in one place."
    >
      <ProfilePageClient />
    </DashboardShell>
  );
}
