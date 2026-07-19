import AdminDashboardClient from "@/components/AdminDashboardClient";
import DashboardShell from "@/components/DashboardShell";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Admin Dashboard",
  description: "Manage StudyAI users and platform analytics.",
  path: "/admin",
});

export default function AdminPage() {
  return (
    <DashboardShell
      eyebrow="Admin"
      title="Admin Dashboard"
      description="Monitor platform usage, manage users, and review StudyAI analytics."
    >
      <AdminDashboardClient />
    </DashboardShell>
  );
}
