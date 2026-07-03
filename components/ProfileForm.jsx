import { Camera, ImageUp, LoaderCircle, LogOut, Mail, Save, Trash2, X } from "lucide-react";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Surface from "./ui/Surface";

export default function ProfileForm({
  fullName,
  email,
  bio,
  avatarUrl,
  hasSavedAvatar,
  hasSelectedAvatar,
  selectedAvatarName,
  uploadProgress,
  isSaving,
  isUploading,
  isDeletingAvatar,
  onFullNameChange,
  onBioChange,
  onAvatarSelect,
  onAvatarUpload,
  onAvatarCancel,
  onAvatarDelete,
  onLogout,
  onSubmit,
}) {
  const isAvatarBusy = isUploading || isDeletingAvatar;

  return (
    <Surface
      as="form"
      onSubmit={onSubmit}
      aria-busy={isSaving || isAvatarBusy}
    >
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-primary-hover dark:text-primary">
          Profile Actions
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-normal text-text dark:text-text">
          Edit your profile
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted dark:text-muted">
          Update your name and avatar. Changes are saved securely to your Supabase profile.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <label className="grid gap-2 text-sm font-bold text-text dark:text-text">
          Full Name
          <Input
            type="text"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            placeholder="Enter your full name"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-text dark:text-text">
          Email Address
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="email"
              value={email || ""}
              readOnly
              className="min-h-11 w-full rounded-xl border border-border bg-surface py-2.5 pl-11 pr-4 text-sm font-semibold text-muted outline-none"
              aria-label="Email address read only"
            />
          </div>
          <span className="text-xs font-semibold text-muted">
            Email is managed by Supabase Auth and cannot be edited here.
          </span>
        </label>

        <label className="grid gap-2 text-sm font-bold text-text dark:text-text">
          Bio
          <textarea
            value={bio || ""}
            onChange={(event) => onBioChange?.(event.target.value)}
            rows={4}
            maxLength={240}
            placeholder="Example: Computer science student preparing for exams with StudyAI."
            className="min-h-28 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 text-text outline-none transition focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70 dark:border-border dark:bg-sidebar dark:text-text"
          />
          <span className="text-xs font-semibold text-muted">
            {(bio || "").length}/240 characters
          </span>
        </label>

        <div className="rounded-2xl border border-border bg-background p-4 dark:border-border dark:bg-sidebar">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0">
              <Avatar
                src={avatarUrl}
                name={fullName}
                size="lg"
                className="h-24 w-24 border-4 border-card text-xl shadow-md dark:border-card"
              />

              <label className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:scale-105 hover:bg-primary-hover focus-within:ring-4 focus-within:ring-primary/25">
                <Camera className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Choose profile picture</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onAvatarSelect}
                  disabled={isAvatarBusy || isSaving}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-text dark:text-text">
                Profile Picture
              </p>
              <p className="mt-1 text-xs leading-5 text-muted dark:text-muted">
                JPG, PNG, or WebP. Maximum size 2 MB. Choose an image to preview it before uploading.
              </p>

              {hasSelectedAvatar && (
                <p className="mt-2 break-words text-xs font-bold text-primary-hover dark:text-primary">
                  Selected: {selectedAvatarName}
                </p>
              )}

              {(isAvatarBusy || uploadProgress > 0) && (
                <div className="mt-3">
                  <div
                    className="h-2 overflow-hidden rounded-full bg-card dark:bg-card"
                    role="progressbar"
                    aria-label="Profile picture upload progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.max(uploadProgress, isAvatarBusy ? 20 : 0)}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.max(uploadProgress, isAvatarBusy ? 20 : 0)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-muted dark:text-muted">
                    {isDeletingAvatar
                      ? "Deleting profile picture..."
                      : isUploading
                        ? "Uploading profile picture..."
                        : uploadProgress === 100
                          ? "Profile picture updated."
                          : "Ready to upload."}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-primary-hover shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 dark:border-border dark:bg-card dark:text-primary dark:hover:bg-primary/15">
                  <ImageUp className="h-4 w-4" aria-hidden="true" />
                  {avatarUrl ? "Choose New Photo" : "Choose Photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onAvatarSelect}
                    disabled={isAvatarBusy || isSaving}
                    className="sr-only"
                  />
                </label>

                {hasSelectedAvatar && (
                  <>
                    <Button
                      type="button"
                      onClick={onAvatarUpload}
                      disabled={isAvatarBusy || isSaving}
                      size="sm"
                    >
                      {isUploading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <ImageUp className="h-4 w-4" aria-hidden="true" />
                      )}
                      Upload Photo
                    </Button>

                    <Button
                      type="button"
                      onClick={onAvatarCancel}
                      disabled={isAvatarBusy}
                      variant="secondary"
                      size="sm"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Cancel
                    </Button>
                  </>
                )}

                {hasSavedAvatar && !hasSelectedAvatar && (
                  <Button
                    type="button"
                    onClick={onAvatarDelete}
                    disabled={isAvatarBusy || isSaving}
                    variant="danger"
                    size="sm"
                  >
                    {isDeletingAvatar ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSaving || isAvatarBusy || hasSelectedAvatar}
          className="w-full"
        >
          {isSaving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {hasSelectedAvatar ? "Upload photo first" : isSaving ? "Saving..." : "Save Changes"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onLogout}
          disabled={isSaving || isAvatarBusy}
          className="w-full"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </Button>
      </div>
    </Surface>
  );
}
