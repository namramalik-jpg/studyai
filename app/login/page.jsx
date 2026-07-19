import AuthForm from "@/components/AuthForm";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Login",
  description: "Log in to your StudyAI account.",
  path: "/login",
});

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
