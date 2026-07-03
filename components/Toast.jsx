export default function Toast({ message, type = "success" }) {
  if (!message) {
    return null;
  }

  const styles =
    type === "error"
      ? "border-red-100 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
      : "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200";

  return (
    <div
      className={`break-words rounded-2xl border px-4 py-3 text-sm font-semibold studyai-fade-in [overflow-wrap:anywhere] ${styles}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      {message}
    </div>
  );
}
