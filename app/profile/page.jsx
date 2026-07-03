import DashboardShell from "@/components/DashboardShell";
import ProfilePageClient from "@/components/ProfilePageClient";

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
