"use client";

import {
  Bell,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  Info,
  Laptop,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import SettingsCard from "./SettingsCard";
import SettingsToggle from "./SettingsToggle";
import Toast from "./Toast";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { SkeletonBlock, SkeletonCard } from "./ui/Skeleton";
import { addStudyNotification } from "@/lib/notifications";
import { getSupabase } from "@/lib/supabase";
import { suppressThemeTransitions } from "@/lib/themeTransition";

const appVersion = "1.0.0";
const developerName = "StudyAI Team";

const defaultPreferences = {
  email_notifications: true,
  ai_completion_notifications: true,
  product_updates: false,
  weekly_study_reminder: true,
  default_ai_feature: "notes",
  default_quiz_difficulty: "medium",
  default_language: "english",
};

const USER_PREFERENCES_SELECT =
  "user_id,email_notifications,ai_completion_notifications,product_updates,weekly_study_reminder,default_ai_feature,default_quiz_difficulty,default_language,created_at,updated_at";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

const aiFeatureOptions = [
  { value: "notes", label: "Notes" },
  { value: "summary", label: "Summary" },
  { value: "quiz", label: "Quiz" },
  { value: "flashcards", label: "Flashcards" },
];

const quizDifficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const languageOptions = [
  { value: "english", label: "English" },
  { value: "urdu", label: "Urdu" },
];

function isMissingTableError(error) {
  const message = error?.message || "";

  return (
    message.includes("Could not find the table") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

function formatDate(value) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-5">
      {[0, 1, 2, 3].map((item) => (
        <SkeletonCard key={item} className="p-5 sm:p-6">
          <div className="flex gap-3">
            <SkeletonBlock className="h-11 w-11 rounded-xl" />
            <div className="w-full">
              <SkeletonBlock className="h-6 w-48 rounded-full" />
              <SkeletonBlock className="mt-3 h-4 w-2/3 rounded-full" />
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <SkeletonBlock className="h-14 rounded-2xl" />
            <SkeletonBlock className="h-14 rounded-2xl" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

function OptionGroup({ label, value, options, onChange, disabled = false }) {
  const groupLabelId = useId();

  return (
    <div className="grid gap-2">
      <span id={groupLabelId} className="text-sm font-black text-text">{label}</span>
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby={groupLabelId}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            role="radio"
            aria-checked={value === option.value}
            className={`min-h-11 rounded-xl border px-4 py-2.5 text-sm font-black transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
              value === option.value
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-border bg-surface text-muted hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThemeSelector({ currentTheme, onChange, disabled = false }) {
  return (
    <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Theme selector">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = currentTheme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            role="radio"
            aria-checked={isActive}
            className={`rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-1 ${
              isActive
                ? "border-primary bg-primary text-white shadow-glow"
                : "border-border bg-surface text-text hover:border-primary/40"
            } disabled:cursor-not-allowed disabled:opacity-70`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <p className="mt-4 text-base font-black">{option.label}</p>
            <p className={`mt-1 text-sm ${isActive ? "text-white/80" : "text-muted"}`}>
              {option.value === "system"
                ? "Follow your device"
                : `${option.label} StudyAI interface`}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function ConfirmModal({ isOpen, confirmationText, isWorking, onChange, onCancel, onConfirm }) {
  if (!isOpen) return null;

  const canDelete = confirmationText.trim().toUpperCase() === "DELETE";

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 id="delete-account-title" className="text-2xl font-black text-text">
              Delete account?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              This permanently deletes your StudyAI account and associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-black text-text">
          Type DELETE to confirm
          <Input
            value={confirmationText}
            onChange={(event) => onChange(event.target.value)}
            disabled={isWorking}
            placeholder="DELETE"
          />
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isWorking}>
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={isWorking || !canDelete}>
            {isWorking ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 break-words text-sm font-black text-text">{value}</p>
      </div>
    </div>
  );
}

export default function SettingsPageClient() {
  const router = useRouter();
  const {
    theme: themePreference,
    resolvedTheme,
    setTheme: setThemePreference,
  } = useTheme();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isThemeMounted, setIsThemeMounted] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [preferencesTableReady, setPreferencesTableReady] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const joinedDate = useMemo(
    () => formatDate(profile?.created_at || user?.created_at),
    [profile?.created_at, user?.created_at]
  );

  const accountType = profile?.role === "admin" ? "Admin" : "User";
  const currentTheme = isThemeMounted ? themePreference || "system" : "system";

  useEffect(() => {
    setIsThemeMounted(true);
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message && !error) return undefined;

    const timeout = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [message, error]);

  async function loadSettings() {
    setIsLoading(true);
    setError("");

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const currentUser = userData.user;

      if (!currentUser) {
        throw new Error("Please log in to manage settings.");
      }

      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,full_name,email,role,created_at")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: currentUser.id,
              full_name: currentUser.user_metadata?.full_name || "",
              email: currentUser.email || "",
              role: "user",
            },
            { onConflict: "id" }
          )
          .select("id,full_name,email,role,created_at")
          .single();

        if (createError) throw createError;
        profileData = createdProfile;
      }

      const { data: preferenceData, error: preferenceError } = await supabase
        .from("user_preferences")
        .select(USER_PREFERENCES_SELECT)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (preferenceError) {
        if (isMissingTableError(preferenceError)) {
          setPreferencesTableReady(false);
          setPreferences(defaultPreferences);
        } else {
          throw preferenceError;
        }
      } else if (!preferenceData) {
        setPreferencesTableReady(true);
        const { data: createdPreferences, error: createPreferenceError } = await supabase
          .from("user_preferences")
          .upsert(
            { user_id: currentUser.id, ...defaultPreferences },
            { onConflict: "user_id" }
          )
          .select(USER_PREFERENCES_SELECT)
          .single();

        if (createPreferenceError) throw createPreferenceError;
        setPreferences({ ...defaultPreferences, ...createdPreferences });
      } else {
        setPreferencesTableReady(true);
        setPreferences({ ...defaultPreferences, ...preferenceData });
      }

      setUser(currentUser);
      setProfile(profileData);
      setFullName(profileData.full_name || currentUser.user_metadata?.full_name || "");
    } catch (settingsError) {
      setError(settingsError.message || "Could not load settings.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleThemeChange(nextTheme) {
    if (!isThemeMounted) return;

    suppressThemeTransitions();
    setThemePreference(nextTheme);
    setMessage(`Theme set to ${nextTheme}.`);
  }

  function updatePreference(key, value) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!user) return;

    const cleanName = fullName.trim();

    if (!cleanName) {
      setError("Full name is required.");
      return;
    }

    setIsSavingProfile(true);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabase();
      const { data, error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: cleanName,
            email: user.email || profile?.email || "",
          },
          { onConflict: "id" }
        )
        .select("id,full_name,email,role,created_at")
        .single();

      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: cleanName },
      });

      if (metadataError) throw metadataError;

      setProfile(data);
      setMessage("Profile updated successfully.");
      addStudyNotification(user.id, {
        title: "Profile updated",
        message: "Your account name was updated from Settings.",
        type: "profile",
      });
    } catch (profileUpdateError) {
      setError(profileUpdateError.message || "Could not update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Confirm password must match password.");
      return;
    }

    setIsSavingPassword(true);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabase();
      const { error: passwordError } = await supabase.auth.updateUser({ password });

      if (passwordError) throw passwordError;

      setPassword("");
      setConfirmPassword("");
      setMessage("Password changed successfully.");

      if (user?.id) {
        addStudyNotification(user.id, {
          title: "Password changed",
          message: "Your StudyAI password was updated.",
          type: "security",
        });
      }
    } catch (passwordUpdateError) {
      setError(passwordUpdateError.message || "Could not change password.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function savePreferences() {
    if (!user) return;

    if (!preferencesTableReady) {
      setError("Preferences table is missing. Run database/settings.sql in Supabase first.");
      return;
    }

    setIsSavingPreferences(true);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabase();
      const payload = {
        user_id: user.id,
        email_notifications: Boolean(preferences.email_notifications),
        ai_completion_notifications: Boolean(preferences.ai_completion_notifications),
        product_updates: Boolean(preferences.product_updates),
        weekly_study_reminder: Boolean(preferences.weekly_study_reminder),
        default_ai_feature: preferences.default_ai_feature,
        default_quiz_difficulty: preferences.default_quiz_difficulty,
        default_language: preferences.default_language,
      };
      const { data, error: preferenceError } = await supabase
        .from("user_preferences")
        .upsert(payload, { onConflict: "user_id" })
        .select(USER_PREFERENCES_SELECT)
        .single();

      if (preferenceError) throw preferenceError;

      setPreferences({ ...defaultPreferences, ...data });
      setMessage("Preferences saved.");
    } catch (preferenceSaveError) {
      setError(preferenceSaveError.message || "Could not save preferences.");
    } finally {
      setIsSavingPreferences(false);
    }
  }

  async function logout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function deleteAccount() {
    setIsDeletingAccount(true);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabase();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Your session expired. Please log in again.");
      }

      const response = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not delete account.");
      }

      await supabase.auth.signOut({ scope: "local" });
      router.push("/");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete account.");
    } finally {
      setIsDeletingAccount(false);
      setDeleteModalOpen(false);
      setDeleteConfirmation("");
    }
  }

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <>
      <ConfirmModal
        isOpen={deleteModalOpen}
        confirmationText={deleteConfirmation}
        isWorking={isDeletingAccount}
        onChange={setDeleteConfirmation}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmation("");
        }}
        onConfirm={deleteAccount}
      />

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Toast message={message} />
          <Toast message={error} type="error" />
          {!preferencesTableReady && (
            <Toast
              type="error"
              message="Preferences are using defaults because user_preferences is missing. Run database/settings.sql in Supabase."
            />
          )}
        </div>

        <SettingsCard
          icon={Sun}
          eyebrow="Appearance"
          title="Choose your theme"
          description="Theme preference is stored locally on this device for fast startup."
        >
          <ThemeSelector
            currentTheme={currentTheme}
            onChange={handleThemeChange}
            disabled={!isThemeMounted}
          />
          {isThemeMounted ? (
            <p className="mt-4 text-sm font-bold text-muted">
              Current active theme:{" "}
              <span className="text-primary">
                {currentTheme}
                {currentTheme === "system" && resolvedTheme ? ` (${resolvedTheme})` : ""}
              </span>
            </p>
          ) : (
            <div className="mt-4 h-5 w-48 rounded-full bg-surface" aria-hidden="true" />
          )}
        </SettingsCard>

        <SettingsCard
          icon={UserRound}
          eyebrow="Account"
          title="Account details"
          description="Manage your profile name and review your account information."
        >
          <form onSubmit={saveProfile} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-black text-text">
                Full Name
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  disabled={isSavingProfile}
                  placeholder="Your full name"
                />
              </label>
              <label className="grid gap-2 text-sm font-black text-text">
                Email Address
                <input
                  value={user?.email || profile?.email || ""}
                  readOnly
                  className="min-h-11 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-muted outline-none"
                />
              </label>
              <div className="grid gap-2 text-sm font-black text-text">
                Joined Date
                <div className="flex min-h-11 items-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-muted">
                  {joinedDate}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                Update Profile
              </Button>
              <Button type="button" variant="secondary" onClick={logout}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </Button>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard
          icon={Bell}
          eyebrow="Notifications"
          title="Notification preferences"
          description="Control which StudyAI updates should reach you."
        >
          <div className="grid gap-3">
            <SettingsToggle
              label="Email Notifications"
              description="Receive important account and study updates by email."
              checked={preferences.email_notifications}
              onChange={(value) => updatePreference("email_notifications", value)}
            />
            <SettingsToggle
              label="AI Completion Notifications"
              description="Notify you when notes, summaries, quizzes, or flashcards finish generating."
              checked={preferences.ai_completion_notifications}
              onChange={(value) => updatePreference("ai_completion_notifications", value)}
            />
            <SettingsToggle
              label="Product Updates"
              description="Get announcements about new StudyAI features."
              checked={preferences.product_updates}
              onChange={(value) => updatePreference("product_updates", value)}
            />
            <SettingsToggle
              label="Weekly Study Reminder"
              description="Receive a weekly nudge to keep your study rhythm."
              checked={preferences.weekly_study_reminder}
              onChange={(value) => updatePreference("weekly_study_reminder", value)}
            />
            <div>
              <Button
                type="button"
                onClick={savePreferences}
                disabled={isSavingPreferences || !preferencesTableReady}
              >
                {isSavingPreferences ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                Save Notification Settings
              </Button>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={BrainCircuit}
          eyebrow="AI Preferences"
          title="Personalize AI defaults"
          description="These defaults are saved in Supabase and can be reused by StudyAI features."
        >
          <div className="grid gap-5">
            <OptionGroup
              label="Default AI Feature"
              value={preferences.default_ai_feature}
              options={aiFeatureOptions}
              onChange={(value) => updatePreference("default_ai_feature", value)}
            />
            <OptionGroup
              label="Default Quiz Difficulty"
              value={preferences.default_quiz_difficulty}
              options={quizDifficultyOptions}
              onChange={(value) => updatePreference("default_quiz_difficulty", value)}
            />
            <OptionGroup
              label="Default Language"
              value={preferences.default_language}
              options={languageOptions}
              onChange={(value) => updatePreference("default_language", value)}
            />
            <div>
              <Button
                type="button"
                onClick={savePreferences}
                disabled={isSavingPreferences || !preferencesTableReady}
              >
                {isSavingPreferences ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                Save Preferences
              </Button>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={ShieldCheck}
          eyebrow="Privacy & Security"
          title="Protect your account"
          description="Change your password, review your active session, or delete your account."
        >
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <form onSubmit={changePassword} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-black text-text">Change Password</h3>
                  <p className="text-sm leading-6 text-muted">Use at least 8 characters.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password"
                  disabled={isSavingPassword}
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  disabled={isSavingPassword}
                />
                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  )}
                  Change Password
                </Button>
              </div>
            </form>

            <div className="grid gap-3">
              <InfoRow
                icon={ShieldCheck}
                label="Active Session"
                value={`Current browser - ${user?.email || "StudyAI account"}`}
              />
              <InfoRow
                icon={CalendarDays}
                label="Last Login"
                value={formatDate(user?.last_sign_in_at)}
              />
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center justify-between gap-4 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-left text-danger transition hover:-translate-y-0.5 hover:bg-danger hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-danger">
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-black">Delete Account</span>
                    <span className="block text-sm opacity-80">Requires confirmation.</span>
                  </span>
                </span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={Info}
          eyebrow="About"
          title="About StudyAI"
          description="Application and project information."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow icon={Sparkles} label="App Version" value={appVersion} />
            <InfoRow icon={UserRound} label="Developer" value={developerName} />
            <InfoRow icon={ShieldCheck} label="Account Type" value={accountType} />
            <InfoRow icon={Mail} label="Privacy Policy" value="Placeholder page coming soon" />
            <InfoRow icon={Info} label="Terms of Service" value="Placeholder page coming soon" />
          </div>
        </SettingsCard>
      </div>
    </>
  );
}
