import { ResetPasswordForm } from "@/components/PasswordResetForms";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Reset Password",
  description: "Create a new StudyAI password.",
  path: "/reset-password",
});

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
