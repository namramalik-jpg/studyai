import AdminDashboardClient from "@/components/AdminDashboardClient";
import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "Admin Dashboard - StudyAI",
  description: "Manage StudyAI users and platform analytics.",
};

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
