import AuthForm from "@/components/AuthForm";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Sign Up",
  description: "Create your free StudyAI account.",
  path: "/signup",
});

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
