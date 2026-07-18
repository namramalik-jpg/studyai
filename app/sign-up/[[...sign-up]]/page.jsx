import AuthForm from "@/components/AuthForm";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Sign Up",
  description: "Create your StudyAI account.",
  path: "/sign-up",
});

export default function SignUpAliasPage() {
  return <AuthForm mode="signup" />;
}
