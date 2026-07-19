import { ForgotPasswordForm } from "@/components/PasswordResetForms";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Forgot Password",
  description: "Reset your StudyAI password securely.",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
