"use client";

import { useEffect, useMemo, useState } from "react";
import { addStudyNotification } from "@/lib/notifications";
import { getSupabase } from "@/lib/supabase";
import ProfileAccountInfo from "./ProfileAccountInfo";
import ProfileAchievements from "./ProfileAchievements";
import ProfileCard from "./ProfileCard";
import ProfileForm from "./ProfileForm";
import ProfileRecentActivity from "./ProfileRecentActivity";
import ProfileSkeleton from "./ProfileSkeleton";
import ProfileStatsGrid from "./ProfileStatsGrid";
import Toast from "./Toast";

const AVATAR_BUCKET = "avatars";
const PROFILE_SELECT = "id,full_name,email,role,avatar_url,bio,created_at,updated_at";
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

const emptyStats = {
  aiRequests: 0,
  notes: 0,
  summaries: 0,
  quizzes: 0,
  flashcardDecks: 0,
  savedNotes: 0,
  studyStreak: 0,
  quizQuestionsSolved: 0,
};

function isMissingTableError(error) {
  const message = error?.message || "";

  return (
    message.includes("Could not find the table") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

async function getCount(supabase, table, userId, options = {}) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (options.allowMissing && isMissingTableError(error)) return 0;
    throw error;
  }

  return count || 0;
}

async function getRows(supabase, table, userId, columns, options = {}) {
  let query = supabase.from(table).select(columns).eq("user_id", userId);

  if (options.since) {
    query = query.gte("created_at", options.since.toISOString());
  }

  if (options.limit) {
    query = query.order("created_at", { ascending: false }).limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    if (options.allowMissing && isMissingTableError(error)) return [];
    throw error;
  }

  return data || [];
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

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function calculateStudyStreak(rows) {
  const activeDays = new Set(
    rows
      .filter((row) => row.created_at)
      .map((row) => getDateKey(new Date(row.created_at)))
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (activeDays.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getFileExtension(fileName) {
  const extension = fileName.split(".").pop();
  return extension ? extension.toLowerCase() : "png";
}

function getAvatarPathFromUrl(url, userId) {
  if (!url || !userId) return null;

  const cleanUrl = url.split("?")[0];
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const markerIndex = cleanUrl.indexOf(marker);

  if (markerIndex === -1) return null;

  const path = decodeURIComponent(cleanUrl.slice(markerIndex + marker.length));
  return path.startsWith(`${userId}/`) ? path : null;
}

function cleanPreview(value, fallback = "Study activity") {
  return (
    String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || fallback
  );
}

function normalizeActivity(row, type) {
  const configs = {
    history: {
      label: row.feature || "AI Request",
      title: "AI generation completed",
      description: cleanPreview(row.prompt || row.response),
    },
    notes: {
      label: "Notes",
      title: row.title || "Saved note",
      description: cleanPreview(row.content || row.generated_notes),
    },
    summary: {
      label: "Summary",
      title: row.topic || "Saved summary",
      description: cleanPreview(row.content || row.generated_summary || row.original_text),
    },
    quiz: {
      label: "Quiz",
      title: row.topic || "Quiz completed",
      description: `${row.total_questions || 0} questions · ${
        row.score === null || row.score === undefined ? "Score not saved" : `Score ${row.score}`
      }`,
    },
    flashcards: {
      label: "Flashcards",
      title: row.topic || "Flashcard deck",
      description: `${row.total_cards || 0} cards generated`,
    },
  };

  const config = configs[type] || configs.history;

  return {
    id: row.id,
    type,
    label: config.label,
    title: config.title,
    description: config.description,
    date: formatDate(row.created_at),
    created_at: row.created_at,
  };
}

function getAchievements(stats) {
  return [
    {
      title: "First AI Note",
      description: "Generate and save your first AI-powered study note.",
      icon: "trophy",
      unlocked: stats.notes >= 1,
    },
    {
      title: "10 Notes Created",
      description: "Build a useful notes library for revision.",
      icon: "book",
      unlocked: stats.notes >= 10,
    },
    {
      title: "50 Quiz Questions Solved",
      description: "Practice recall with AI-generated quiz questions.",
      icon: "target",
      unlocked: stats.quizQuestionsSolved >= 50,
    },
    {
      title: "7-Day Study Streak",
      description: "Study with StudyAI for seven active days in a row.",
      icon: "flame",
      unlocked: stats.studyStreak >= 7,
    },
  ];
}

export default function ProfilePageClient() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [activities, setActivities] = useState([]);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const achievements = useMemo(() => getAchievements(stats), [stats]);

  const accountInfo = useMemo(() => {
    const role = profile?.role === "admin" ? "Admin" : "User";
    const emailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);

    return [
      {
        label: "Email Verified",
        value: emailVerified ? "Verified" : "Not verified",
        icon: "verified",
      },
      {
        label: "Account Type",
        value: role,
        icon: "account",
      },
      {
        label: "Last Login",
        value: formatDate(user?.last_sign_in_at),
        icon: "login",
      },
      {
        label: "Member Since",
        value: formatDate(profile?.created_at || user?.created_at),
        icon: "member",
      },
    ];
  }, [profile?.created_at, profile?.role, user]);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setIsLoading(true);
      setError("");

      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        const currentUser = userData.user;

        if (!currentUser) {
          throw new Error("Please login to view your profile.");
        }

        let { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(PROFILE_SELECT)
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
                avatar_url: null,
                bio: "",
              },
              { onConflict: "id" }
            )
            .select(PROFILE_SELECT)
            .single();

          if (createError) throw createError;

          profileData = createdProfile;
        }

        const streakStart = new Date();
        streakStart.setDate(streakStart.getDate() - 60);
        streakStart.setHours(0, 0, 0, 0);

        const [
          notesCount,
          summariesCount,
          quizzesCount,
          flashcardDecksCount,
          aiRequestsCount,
          noteRows,
          summaryRows,
          quizRows,
          flashcardRows,
          recentHistory,
          recentNotes,
          recentSummaries,
          recentQuizzes,
          recentFlashcards,
        ] = await Promise.all([
          getCount(supabase, "notes", currentUser.id, { allowMissing: true }),
          getCount(supabase, "summaries", currentUser.id, { allowMissing: true }),
          getCount(supabase, "quiz_history", currentUser.id, { allowMissing: true }),
          getCount(supabase, "flashcard_decks", currentUser.id, { allowMissing: true }),
          getCount(supabase, "ai_history", currentUser.id, { allowMissing: true }),
          getRows(supabase, "notes", currentUser.id, "created_at", {
            since: streakStart,
            allowMissing: true,
          }),
          getRows(supabase, "summaries", currentUser.id, "created_at", {
            since: streakStart,
            allowMissing: true,
          }),
          getRows(supabase, "quiz_history", currentUser.id, "total_questions,created_at", {
            allowMissing: true,
          }),
          getRows(supabase, "flashcard_decks", currentUser.id, "created_at", {
            since: streakStart,
            allowMissing: true,
          }),
          getRows(supabase, "ai_history", currentUser.id, "id,feature,prompt,response,created_at", {
            limit: 5,
            allowMissing: true,
          }),
          getRows(supabase, "notes", currentUser.id, "id,title,content,generated_notes,created_at", {
            limit: 3,
            allowMissing: true,
          }),
          getRows(supabase, "summaries", currentUser.id, "id,topic,content,generated_summary,original_text,created_at", {
            limit: 3,
            allowMissing: true,
          }),
          getRows(supabase, "quiz_history", currentUser.id, "id,topic,total_questions,score,created_at", {
            limit: 3,
            allowMissing: true,
          }),
          getRows(supabase, "flashcard_decks", currentUser.id, "id,topic,total_cards,created_at", {
            limit: 3,
            allowMissing: true,
          }),
        ]);

        const quizQuestionsSolved = quizRows.reduce(
          (total, row) => total + Number(row.total_questions || 0),
          0
        );
        const nextStats = {
          notes: notesCount,
          summaries: summariesCount,
          quizzes: quizzesCount,
          flashcardDecks: flashcardDecksCount,
          savedNotes: notesCount + summariesCount + quizzesCount + flashcardDecksCount,
          aiRequests: aiRequestsCount,
          studyStreak: calculateStudyStreak([
            ...noteRows,
            ...summaryRows,
            ...quizRows,
            ...flashcardRows,
          ]),
          quizQuestionsSolved,
        };

        const nextActivities = [
          ...recentHistory.map((row) => normalizeActivity(row, "history")),
          ...recentNotes.map((row) => normalizeActivity(row, "notes")),
          ...recentSummaries.map((row) => normalizeActivity(row, "summary")),
          ...recentQuizzes.map((row) => normalizeActivity(row, "quiz")),
          ...recentFlashcards.map((row) => normalizeActivity(row, "flashcards")),
        ]
          .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))
          .slice(0, 5);

        if (!ignore) {
          setUser(currentUser);
          setProfile(profileData);
          setFullName(profileData.full_name || currentUser.user_metadata?.full_name || "");
          setBio(profileData.bio || "");
          setAvatarUrl(profileData.avatar_url || "");
          setStats(nextStats);
          setActivities(nextActivities);
        }
      } catch (profileError) {
        if (!ignore) {
          setError(profileError.message || "Could not load profile.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    if (!message && !error) return undefined;

    const timeout = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [message, error]);

  function selectAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Only JPG, JPEG, PNG, and WebP images are allowed.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Profile picture must be 2 MB or smaller.");
      return;
    }

    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);

    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setUploadProgress(0);
    setError("");
    setMessage("Preview ready. Click Upload Photo to save it.");
  }

  function cancelAvatarSelection() {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);

    setSelectedAvatarFile(null);
    setAvatarPreviewUrl("");
    setUploadProgress(0);
    setMessage("");
    setError("");
  }

  async function uploadAvatar() {
    if (!selectedAvatarFile || !user) {
      setError("Please choose an image first.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabase();
      const previousPath = getAvatarPathFromUrl(avatarUrl, user.id);
      const path = `${user.id}/avatar-${Date.now()}.${getFileExtension(selectedAvatarFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, selectedAvatarFile, {
          cacheControl: "60",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(65);

      const { data: publicUrlData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(path);

      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: fullName.trim() || profile?.full_name || "",
            email: user.email || profile?.email || "",
            avatar_url: publicUrlData.publicUrl,
            bio: bio.trim(),
          },
          { onConflict: "id" }
        )
        .select(PROFILE_SELECT)
        .single();

      if (profileError) throw profileError;

      setUploadProgress(90);

      if (previousPath && previousPath !== path) {
        await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
      }

      setProfile(updatedProfile);
      setAvatarUrl(updatedProfile.avatar_url || "");
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");
      setUploadProgress(100);
      setMessage("Profile picture updated successfully.");
      addStudyNotification(user.id, {
        title: "Profile updated",
        message: "Your profile picture was updated successfully.",
        type: "profile",
      });
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload profile picture.");
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteAvatar() {
    if (!user || !avatarUrl) {
      cancelAvatarSelection();
      return;
    }

    setIsDeletingAvatar(true);
    setUploadProgress(15);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabase();
      const currentPath = getAvatarPathFromUrl(avatarUrl, user.id);

      if (currentPath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([currentPath]);
      }

      setUploadProgress(70);

      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: fullName.trim() || profile?.full_name || "",
            email: user.email || profile?.email || "",
            avatar_url: null,
            bio: bio.trim(),
          },
          { onConflict: "id" }
        )
        .select(PROFILE_SELECT)
        .single();

      if (profileError) throw profileError;

      setProfile(updatedProfile);
      setAvatarUrl("");
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl("");
      setUploadProgress(100);
      setMessage("Profile picture removed.");
      addStudyNotification(user.id, {
        title: "Profile updated",
        message: "Your profile picture was removed.",
        type: "profile",
      });
    } catch (deleteError) {
      setError(deleteError.message || "Could not remove profile picture.");
    } finally {
      setIsDeletingAvatar(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!user) {
      setError("Please login again.");
      return;
    }

    if (selectedAvatarFile) {
      setError("Please upload or cancel the selected profile picture first.");
      return;
    }

    const cleanName = fullName.trim();
    const cleanBio = bio.trim();

    if (!cleanName) {
      setError("Full name is required.");
      return;
    }

    if (cleanBio.length > 240) {
      setError("Bio must be 240 characters or fewer.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabase();
      const { data, error: saveError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: cleanName,
            email: user.email || profile?.email || "",
            avatar_url: avatarUrl || null,
            bio: cleanBio,
          },
          { onConflict: "id" }
        )
        .select(PROFILE_SELECT)
        .single();

      if (saveError) throw saveError;

      setProfile(data);
      setFullName(data.full_name || "");
      setBio(data.bio || "");
      setAvatarUrl(data.avatar_url || "");
      setMessage("Profile updated successfully.");
      addStudyNotification(user.id, {
        title: "Profile updated",
        message: "Your StudyAI profile details were saved.",
        type: "profile",
      });
    } catch (saveError) {
      setError(saveError.message || "Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <Toast message={message} />
        <Toast message={error} type="error" />
      </div>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <ProfileCard
          profile={{
            ...profile,
            full_name: fullName,
            bio,
            avatar_url: avatarPreviewUrl || avatarUrl,
          }}
          email={user?.email}
        />
        <ProfileForm
          fullName={fullName}
          email={user?.email || profile?.email}
          bio={bio}
          avatarUrl={avatarPreviewUrl || avatarUrl}
          hasSavedAvatar={Boolean(avatarUrl)}
          hasSelectedAvatar={Boolean(selectedAvatarFile)}
          selectedAvatarName={selectedAvatarFile?.name || ""}
          uploadProgress={uploadProgress}
          isSaving={isSaving}
          isUploading={isUploading}
          isDeletingAvatar={isDeletingAvatar}
          onFullNameChange={(value) => {
            setFullName(value);
            setError("");
          }}
          onBioChange={(value) => {
            setBio(value);
            setError("");
          }}
          onAvatarSelect={selectAvatar}
          onAvatarUpload={uploadAvatar}
          onAvatarCancel={cancelAvatarSelection}
          onAvatarDelete={deleteAvatar}
          onLogout={handleLogout}
          onSubmit={saveProfile}
        />
      </section>

      <ProfileStatsGrid stats={stats} />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <ProfileAchievements achievements={achievements} />
        <ProfileAccountInfo items={accountInfo} />
      </section>

      <ProfileRecentActivity activities={activities} />
    </div>
  );
}
