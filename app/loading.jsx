import { Sparkles } from "lucide-react";
import { SkeletonBlock, SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-text sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card dark:bg-card/85 dark:shadow-card-dark sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5 animate-pulse" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="mt-3 h-8 w-full max-w-md" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading content">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonCard key={item} className="h-36 rounded-3xl" />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SkeletonCard className="h-96 rounded-3xl" />
          <SkeletonCard className="h-96 rounded-3xl" />
        </section>
      </div>
    </main>
  );
}
