import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Supabase errors are plain objects with a `message`, not Error instances.
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message || fallback;
  }
  return fallback;
}
