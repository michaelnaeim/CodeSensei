import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("panel p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info";
}) {
  const styles = {
    default: "bg-[var(--bg-muted)] text-[var(--text-secondary)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
    info: "bg-[var(--accent-soft)] text-[var(--accent)]",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", styles[variant])}>
      {children}
    </span>
  );
}
