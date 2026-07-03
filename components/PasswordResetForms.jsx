"use client";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabase, isSupabaseFetchError } from "@/lib/supabase";
import Toast from "./Toast";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) return { score: 0, label: "Start typing", className: "bg-border" };
  if (score <= 1) return { score, label: "Weak", className: "bg-danger" };
  if (score <= 3) return { score, label: "Good", className: "bg-warning" };
  return { score, label: "Strong", className: "bg-success" };
}

function friendlyResetError(error) {
  const message = error?.message?.toLowerCase() || "";

  if (isSupabaseFetchError(error)) {
    return "We could not connect to StudyAI right now. Please check your internet and try again.";
  }

  if (message.includes("expired") || message.includes("invalid")) {
    return "This reset link is invalid or expired. Please request a new one.";
  }

  if (message.includes("password")) {
    return "Please enter a stronger password with at least 8 characters.";
  }

  return "Something went wrong. Please try again.";
}

function AuthShell({ badge, title, description, children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-text sm:px-5 sm:py-16">
      <div className="pointer-events-none absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] bottom-0 h-[34rem] w-[34rem] rounded-full bg-violet-500/10 blur-3xl" />

      <section className="relative w-full max-w-xl rounded-[2rem] border border-border bg-card/90 p-5 shadow-card backdrop-blur-xl dark:bg-card/80 dark:shadow-card-dark sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-primary-hover">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          StudyAI
        </Link>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
          {badge}
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-text sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {description}
        </p>
        {children}
      </section>
    </main>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setFieldError("Email is required.");
      return;
    }

    if (!emailPattern.test(cleanEmail)) {
      setFieldError("Enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabase();
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (resetError) {
        throw resetError;
      }

      setMessage("Password reset email sent. Please check your inbox.");
    } catch (resetError) {
      setError(friendlyResetError(resetError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      badge="Password reset"
      title="Reset your password"
      description="Enter your email and StudyAI will send a secure password reset link."
    >
      <form onSubmit={handleSubmit} noValidate className="mt-7 grid gap-5">
        <label className="grid gap-2 text-sm font-bold text-text">
          Email
          <span className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldError("");
              }}
              aria-label="Email"
              className={`min-h-12 w-full rounded-2xl border bg-background/80 px-11 py-3 font-medium text-text outline-none transition placeholder:text-muted focus:bg-card focus:ring-4 dark:bg-sidebar/80 ${
                fieldError
                  ? "border-danger/60 focus:border-danger focus:ring-danger/15"
                  : "border-border focus:border-primary focus:ring-primary/15"
              }`}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "reset-email-error" : undefined}
            />
          </span>
          {fieldError && (
            <span id="reset-email-error" className="text-xs font-semibold text-danger">
              {fieldError}
            </span>
          )}
        </label>

        <Toast message={message} />
        <Toast message={error} type="error" />

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          {isLoading ? "Sending..." : "Send reset email"}
        </button>

        <p className="text-center text-sm text-muted">
          Remember your password?{" "}
          <Link href="/login" className="font-black text-primary transition hover:text-primary-hover">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      setIsRecoveryReady(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsRecoveryReady(true);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  function validateForm() {
    const nextErrors = {};

    if (!password) {
      nextErrors.password = "New password is required.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm password is required.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("Password updated successfully. Redirecting to login...");
      window.setTimeout(() => router.push("/login"), 900);
    } catch (resetError) {
      setError(friendlyResetError(resetError));
    } finally {
      setIsLoading(false);
    }
  }

  function inputClass(hasError) {
    return `min-h-12 w-full rounded-2xl border bg-background/80 px-11 py-3 pr-12 font-medium text-text outline-none transition placeholder:text-muted focus:bg-card focus:ring-4 dark:bg-sidebar/80 ${
      hasError
        ? "border-danger/60 focus:border-danger focus:ring-danger/15"
        : "border-border focus:border-primary focus:ring-primary/15"
    }`;
  }

  return (
    <AuthShell
      badge="New password"
      title="Create a new password"
      description="Choose a strong password to secure your StudyAI account."
    >
      {!isRecoveryReady && (
        <div className="mt-6 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm font-semibold leading-6 text-muted">
          Open this page from the password reset email. If your link expired,
          request a new reset email.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-7 grid gap-5">
        <label className="grid gap-2 text-sm font-bold text-text">
          New Password
          <span className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((current) => ({ ...current, password: "", confirmPassword: "" }));
              }}
              aria-label="New password"
              className={inputClass(Boolean(fieldErrors.password))}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "new-password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((currentValue) => !currentValue)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition hover:bg-surface hover:text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </span>
          {fieldErrors.password && (
            <span id="new-password-error" className="text-xs font-semibold text-danger">
              {fieldErrors.password}
            </span>
          )}
        </label>

        <div>
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-muted">
            <span>Password strength</span>
            <span>{passwordStrength.label}</span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2" aria-hidden="true">
            {[1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className={`h-1.5 rounded-full ${
                  passwordStrength.score >= bar ? passwordStrength.className : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        <label className="grid gap-2 text-sm font-bold text-text">
          Confirm Password
          <span className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setFieldErrors((current) => ({ ...current, confirmPassword: "" }));
              }}
              aria-label="Confirm new password"
              className={inputClass(Boolean(fieldErrors.confirmPassword))}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? "confirm-new-password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition hover:bg-surface hover:text-primary"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </span>
          {fieldErrors.confirmPassword && (
            <span id="confirm-new-password-error" className="text-xs font-semibold text-danger">
              {fieldErrors.confirmPassword}
            </span>
          )}
        </label>

        <Toast message={message} />
        <Toast message={error} type="error" />

        <button
          type="submit"
          disabled={isLoading || !isRecoveryReady}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          {isLoading ? "Updating..." : "Update password"}
        </button>

        <p className="text-center text-sm text-muted">
          Need a new link?{" "}
          <Link href="/forgot-password" className="font-black text-primary transition hover:text-primary-hover">
            Send reset email
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
