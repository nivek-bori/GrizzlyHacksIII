"use client";

import { cn } from "@/types/types";

type LoadingComponentProps = {
  loading?: boolean;
  className?: string;
  label?: string;
};

export default function LoadingComponent({
  loading = true,
  className,
  label = "Loading…",
}: LoadingComponentProps) {
  if (!loading) return null;

  return (
    <div className={cn("flex min-h-20 w-full h-full flex-col items-center justify-center gap-4 py-10", className)}
      role="status"
      aria-live="polite"
    >
      <div
        className="h-8 w-8 rounded-full border-[3px] border-neutral-300 border-t-neutral-800 animate-spin"
        aria-hidden
      />
      {label ? (
        <p className="text-sm font-medium tracking-wide text-neutral-600">{label}</p>
      ) : null}
    </div>
  );
}
