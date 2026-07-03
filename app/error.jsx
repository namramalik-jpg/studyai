"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Error({ reset }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-text">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 text-center shadow-card studyai-scale-in dark:bg-card/85 dark:shadow-card-dark sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-text">
          Something went wrong
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          StudyAI could not load this view. Please try again, and check your
          connection if the problem continues.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button as={Link} href="/dashboard" variant="secondary">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go to dashboard
          </Button>
        </div>
      </section>
    </main>
  );
}
