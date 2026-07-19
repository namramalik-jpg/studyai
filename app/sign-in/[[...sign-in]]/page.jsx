import AuthForm from "@/components/AuthForm";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Sign In",
  description: "Sign in to StudyAI.",
  path: "/sign-in",
});

export default function SignInAliasPage() {
  return <AuthForm mode="login" />;
}
