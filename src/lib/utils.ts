import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Capitalises the first letter and ends the message with a full stop, as the legacy UI did for server errors. */
export function sentence(message: string): string {
  const m = String(message || '')
  if (!m) return m
  return m.charAt(0).toUpperCase() + m.slice(1) + (/[.!?…]$/.test(m) ? '' : '.')
}
