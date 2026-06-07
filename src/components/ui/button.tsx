"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-white text-black hover:bg-zinc-200 border border-transparent",
  secondary: "bg-[var(--bg-elevated)] text-[var(--text)] hover:bg-[var(--border-strong)] border border-[var(--border)]",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] border border-transparent",
  outline: "bg-transparent text-[var(--text)] hover:bg-[var(--bg-surface)] border border-[var(--border)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className, variant = "primary", size = "md", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
      variants[variant],
      sizes[size],
      className
    )}
    {...props}
  />
));
Button.displayName = "Button";
