import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Dashboard",
  description: "Open your StudyAI workspace.",
  path: "/dashboard",
});

export default function DashboardLayout({ children }) {
  return children;
}
