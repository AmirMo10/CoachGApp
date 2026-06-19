import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Shared UI primitives (shadcn/ui based) live here so the coach, client, and
 * admin portals share a design system. Components are consumed as source and
 * styled with the app's Tailwind config.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const designTokens = {
  brand: '#16A34A',
  brandDark: '#15803D',
  ink: '#0F172A',
} as const;
