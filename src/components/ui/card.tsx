"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 transition-colors",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1 w-full rounded-full bg-[var(--bg-muted)]", className)}>
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "error";
  className?: string;
}) {
  const vars: Record<string, string> = {
    default: "border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-muted)]",
    success: "border-green-800/50 text-green-400 bg-green-950/30",
    warning: "border-amber-800/50 text-amber-400 bg-amber-950/30",
    info: "border-blue-800/50 text-blue-400 bg-blue-950/30",
    error: "border-red-800/50 text-red-400 bg-red-950/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        vars[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
