// Canonical class-merge helper. Import everywhere you build className strings.
// Copy to: src/lib/utils.ts
// Requires: clsx, tailwind-merge (already in this stack)
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
