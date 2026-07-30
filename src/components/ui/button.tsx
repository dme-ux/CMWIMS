"use client";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type Variant = "primary" | "ghost" | "outline";
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-glass disabled:opacity-60",
  ghost: "text-ink-soft hover:bg-brand-50 dark:hover:bg-white/5",
  outline:
    "border border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-white/10 dark:text-brand-200",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", loading, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
        styles[variant],
        className
      )}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
