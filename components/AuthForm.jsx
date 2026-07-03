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
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  getSupabase,
  isSupabaseFetchError,
  setSessionPersistencePreference,
} from "@/lib/supabase";
import Toast from "./Toast";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getFriendlyAuthError(error, mode) {
  const message = error?.message || "";
  const lowerMessage = message.toLowerCase();

  if (isSupabaseFetchError(error)) {
    return "We could not connect to StudyAI right now. Please check your internet and try again.";
  }

  if (lowerMessage.includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }

  if (lowerMessage.includes("email not confirmed")) {
    return "Please confirm your email before logging in.";
  }

  if (lowerMessage.includes("already registered") || lowerMessage.includes("user already")) {
    return "An account with this email may already exist. Try logging in instead.";
  }

  if (lowerMessage.includes("password")) {
    return mode === "signup"
      ? "Please choose a stronger password with at least 8 characters."
      : "Please check your password and try again.";
  }

  if (lowerMessage.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "Something went wrong. Please check your details and try again.";
}

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return { score: 0, label: "Start typing", className: "bg-border" };
  }

  if (score <= 1) {
    return { score, label: "Weak", className: "bg-danger" };
  }

  if (score <= 3) {
    return { score, label: "Good", className: "bg-warning" };
  }

  return { score, label: "Strong", className: "bg-success" };
}

function FieldError({ id, message }) {
  if (!message) return null;

  return (
    <span id={id} className="text-xs font-semibold text-danger">
      {message}
    </span>
  );
}

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    let isMounted = true;

    async function redirectAuthenticatedUser() {
      const { user } = await getCurrentUser();

      if (!isMounted) return;

      if (user) {
        router.replace("/dashboard");
        return;
      }

      setIsCheckingSession(false);
    }

    redirectAuthenticatedUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function validateForm() {
    const nextErrors = {};
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    if (isSignup && !trimmedFullName) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (isSignup && password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (isSignup && !confirmPassword) {
      nextErrors.confirmPassword = "Confirm password is required.";
    } else if (isSignup && confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (isSignup && !acceptTerms) {
      nextErrors.acceptTerms = "Please accept the Terms & Conditions.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function clearFieldError(field) {
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function createProfileIfPossible({ supabase, user, cleanEmail, cleanFullName }) {
    if (!user) return;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: cleanFullName,
        email: user.email || cleanEmail,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      throw profileError;
    }
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
      const cleanEmail = email.trim();
      const cleanFullName = fullName.trim();

      if (isSignup) {
        const result = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanFullName,
              newsletter_opt_in: newsletter,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/dashboard`,
          },
        });

        if (result.error) {
          throw result.error;
        }

        if (result.data.session) {
          await createProfileIfPossible({
            supabase,
            user: result.data.user,
            cleanEmail,
            cleanFullName,
          });
          setMessage("Account created. Redirecting to your dashboard...");
          window.setTimeout(() => router.push("/dashboard"), 650);
          return;
        }

        setMessage("Account created. Please check your email to verify your account.");
        return;
      }

      setSessionPersistencePreference(rememberMe);

      const result = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (result.error) {
        throw result.error;
      }

      setMessage(rememberMe ? "Login successful. Restoring your workspace..." : "Login successful.");
      window.setTimeout(() => router.push("/dashboard"), 550);
    } catch (authError) {
      setError(getFriendlyAuthError(authError, mode));
    } finally {
      setIsLoading(false);
    }
  }

  function inputClasses(hasError, hasRightIcon = false) {
    return [
      "min-h-12 w-full rounded-2xl border bg-background/80 px-11 py-3 font-medium text-text outline-none transition placeholder:text-muted focus:bg-card focus:ring-4 dark:bg-sidebar/80 dark:text-text",
      hasRightIcon ? "pr-12" : "",
      hasError
        ? "border-danger/60 focus:border-danger focus:ring-danger/15"
        : "border-border focus:border-primary focus:ring-primary/15",
    ].join(" ");
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-text">
        <div className="rounded-3xl border border-border bg-card px-6 py-5 shadow-card">
          <div className="flex items-center gap-3 text-sm font-bold text-primary">
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            Checking your session...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-text sm:px-5 sm:py-16">
      <div className="pointer-events-none absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] bottom-0 h-[34rem] w-[34rem] rounded-full bg-violet-500/10 blur-3xl" />

      <section className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-card/90 shadow-card backdrop-blur-xl dark:bg-card/80 dark:shadow-card-dark lg:grid-cols-[0.88fr_1.12fr]">
        <div className="hidden bg-[linear-gradient(135deg,#6366F1,#4F46E5_48%,#7C3AED)] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="inline-flex items-center gap-3 rounded-2xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-black">StudyAI</span>
          </Link>

          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/90">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Secure Supabase Auth
            </p>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight">
              Your AI study workspace, protected.
            </h2>
            <p className="mt-4 text-base leading-7 text-indigo-50/85">
              Sign in to save notes, track history, create quizzes, and continue
              studying across sessions.
            </p>
          </div>

          <div className="grid gap-3 text-sm font-semibold text-indigo-50/90">
            {["Persistent sessions", "Protected dashboard", "Private study history"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="p-5 sm:p-8 lg:p-10"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-primary-hover lg:hidden">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            StudyAI
          </Link>

          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            {isSignup ? "Create account" : "Welcome back"}
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-text sm:text-4xl">
            {isSignup ? "Start studying smarter" : "Login to StudyAI"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            {isSignup
              ? "Create your account to save notes, summaries, solved questions, and study history."
              : "Access your dashboard, saved notes, AI history, and study tools."}
          </p>

          <div className="mt-7 grid gap-4">
            {isSignup && (
              <label className="grid gap-2 text-sm font-bold text-text">
                Full Name
                <span className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      clearFieldError("fullName");
                    }}
                    aria-label="Full name"
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                    className={inputClasses(Boolean(fieldErrors.fullName))}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </span>
                <FieldError id="fullName-error" message={fieldErrors.fullName} />
              </label>
            )}

            <label className="grid gap-2 text-sm font-bold text-text">
              Email
              <span className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearFieldError("email");
                  }}
                  aria-label="Email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={inputClasses(Boolean(fieldErrors.email))}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </span>
              <FieldError id="email-error" message={fieldErrors.email} />
            </label>

            <label className="grid gap-2 text-sm font-bold text-text">
              Password
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFieldError("password");
                    clearFieldError("confirmPassword");
                  }}
                  aria-label="Password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  className={inputClasses(Boolean(fieldErrors.password), true)}
                  placeholder={isSignup ? "At least 8 characters" : "Your password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
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
              <FieldError id="password-error" message={fieldErrors.password} />
            </label>

            {isSignup && (
              <>
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
                        clearFieldError("confirmPassword");
                      }}
                      aria-label="Confirm password"
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                      className={inputClasses(Boolean(fieldErrors.confirmPassword), true)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
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
                  <FieldError id="confirmPassword-error" message={fieldErrors.confirmPassword} />
                </label>
              </>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            {isSignup ? (
              <>
                <label className="flex gap-3 text-sm font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(event) => {
                      setAcceptTerms(event.target.checked);
                      clearFieldError("acceptTerms");
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>
                    I accept the{" "}
                    <a href="mailto:hello@studyai.com?subject=StudyAI%20Terms%20and%20Conditions" className="font-bold text-primary">
                      Terms & Conditions
                    </a>
                    .
                  </span>
                </label>
                <FieldError id="acceptTerms-error" message={fieldErrors.acceptTerms} />
                <label className="flex gap-3 text-sm font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={newsletter}
                    onChange={(event) => setNewsletter(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Send me product updates and study tips.</span>
                </label>
              </>
            ) : (
              <div className="flex flex-col gap-3 text-sm font-semibold text-muted sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className="font-bold text-primary transition hover:text-primary-hover">
                  Forgot Password?
                </Link>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            <Toast message={message} />
            <Toast message={error} type="error" />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            {isLoading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
          </button>

          <p className="mt-6 text-center text-sm text-muted">
            {isSignup ? "Already have an account?" : "Do not have an account?"}{" "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-black text-primary transition hover:text-primary-hover"
            >
              {isSignup ? "Login" : "Sign up"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
