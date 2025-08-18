import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from "dompurify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sanitize any user-provided string: strip all tags/attributes and trim whitespace
export function sanitizeInput(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const cleaned = DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return cleaned.trim();
}

// Shallow sanitize all string values in a record before submitting or displaying
export function sanitizeRecord<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    sanitized[k] = typeof v === "string" ? sanitizeInput(v) : v;
  }
  return sanitized as T;
}
