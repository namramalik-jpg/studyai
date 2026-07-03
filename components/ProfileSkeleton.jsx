import { SkeletonBlock, SkeletonCard } from "./ui/Skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <SkeletonCard className="p-5 sm:p-6">
          <SkeletonBlock className="h-28 rounded-2xl bg-primary/15 dark:bg-primary/15" />
          <SkeletonBlock className="-mt-10 ml-4 h-24 w-24 rounded-full bg-primary/15 dark:bg-primary/15" />
          <SkeletonBlock className="mt-5 h-7 w-48 rounded-full" />
          <SkeletonBlock className="mt-3 h-4 w-64 rounded-full" />
          <div className="mt-6 grid gap-3">
            <SkeletonBlock className="h-16 rounded-2xl bg-background dark:bg-sidebar" />
            <SkeletonBlock className="h-16 rounded-2xl bg-background dark:bg-sidebar" />
            <SkeletonBlock className="h-16 rounded-2xl bg-background dark:bg-sidebar" />
          </div>
        </SkeletonCard>
        <SkeletonCard className="p-5 sm:p-6">
          <div className="grid gap-4">
            <SkeletonBlock className="h-6 w-40 rounded-full" />
            <SkeletonBlock className="h-12 rounded-xl bg-background dark:bg-sidebar" />
            <SkeletonBlock className="h-12 rounded-xl bg-background dark:bg-sidebar" />
            <SkeletonBlock className="h-28 rounded-xl bg-background dark:bg-sidebar" />
            <SkeletonBlock className="h-12 rounded-xl bg-primary/15 dark:bg-primary/15" />
          </div>
        </SkeletonCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6].map((item) => (
          <SkeletonCard key={item} className="p-5">
            <SkeletonBlock className="h-5 w-32 rounded-full" />
            <SkeletonBlock className="mt-8 h-9 w-20 rounded-full" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
