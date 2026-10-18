// Tailwind class sets for the tone / tint names used in JSON config.
// Classes must be written out in full so Tailwind can detect them.

import type { Tint, Tone } from '.'

/** Soft tinted surface + readable text, light and dark */
export const TINT_CLASSES: Record<Tint, string> = {
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300',
  stone: 'bg-stone-100 text-stone-700 dark:bg-stone-400/15 dark:text-stone-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300',
  teal: 'bg-teal-50 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
  amber: 'bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
  yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-400/15 dark:text-yellow-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-300',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
}

/** Bordered lane / panel variant of a tint */
export const TINT_PANEL_CLASSES: Record<Tint, string> = {
  orange: 'border-orange-200 bg-orange-50/60 dark:border-orange-400/25 dark:bg-orange-400/10',
  stone: 'border-stone-200 bg-stone-50/60 dark:border-stone-400/25 dark:bg-stone-400/10',
  sky: 'border-sky-200 bg-sky-50/60 dark:border-sky-400/25 dark:bg-sky-400/10',
  slate: 'border-slate-200 bg-slate-50/60 dark:border-slate-400/25 dark:bg-slate-400/10',
  teal: 'border-teal-200 bg-teal-50/60 dark:border-teal-400/25 dark:bg-teal-400/10',
  amber: 'border-amber-200 bg-amber-50/60 dark:border-amber-400/25 dark:bg-amber-400/10',
  violet: 'border-violet-200 bg-violet-50/60 dark:border-violet-400/25 dark:bg-violet-400/10',
  yellow: 'border-yellow-200 bg-yellow-50/60 dark:border-yellow-400/25 dark:bg-yellow-400/10',
  rose: 'border-rose-200 bg-rose-50/60 dark:border-rose-400/25 dark:bg-rose-400/10',
  emerald: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-400/25 dark:bg-emerald-400/10',
  red: 'border-red-200 bg-red-50/60 dark:border-red-400/25 dark:bg-red-400/10',
  indigo: 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-400/25 dark:bg-indigo-400/10',
}

/** Icon chip for KPI cards etc., driven by semantic theme tokens */
export const TONE_CHIP_CLASSES: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  navy: 'bg-muted text-foreground',
}

export const TONE_TEXT_CLASSES: Record<Tone, string> = {
  neutral: 'text-muted-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  navy: 'text-foreground',
}

export const DOT_CLASSES = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  amber: 'bg-amber-400',
} as const
