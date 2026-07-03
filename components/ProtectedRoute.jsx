"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/supabase";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkUser() {
      const { user, error } = await getCurrentUser();

      if (!isMounted) {
        return;
      }

      if (error) {
        setSessionError(error.message || "Unable to connect to Supabase.");
      }

      if (!user) {
        router.replace("/login");
        setIsChecking(false);
        return;
      }

      setIsAllowed(true);
      setIsChecking(false);
    }

    checkUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isChecking || !isAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 text-primary-hover dark:bg-background dark:text-primary">
        <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-card backdrop-blur-xl dark:border-border dark:bg-card" role="status" aria-live="polite">
          <div className="flex items-center gap-3 break-words text-sm font-bold">
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            {sessionError || "Checking your session..."}
          </div>
        </div>
      </main>
    );
  }

  return children;
}
