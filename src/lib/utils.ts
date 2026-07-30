import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge tailwind classes safely (conditional + conflict-resolving). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Indian currency formatter. */
export function inr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}
