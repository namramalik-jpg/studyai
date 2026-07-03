import { SearchX, Home, Sparkles } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-text">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 text-center shadow-card studyai-scale-in dark:bg-card/85 dark:shadow-card-dark sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SearchX className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-wide text-primary">
          404
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-text">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          This StudyAI page may have moved or the link is incomplete.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button as={Link} href="/dashboard">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Open workspace
          </Button>
          <Button as={Link} href="/" variant="secondary">
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Button>
        </div>
      </section>
    </main>
  );
}
