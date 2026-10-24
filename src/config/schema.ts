import { z } from 'zod'

// Startup validation for the JSON configuration. A bad value fails fast with a readable
// message instead of breaking a screen later. Only the shapes the code depends on are checked.

const widthToken = z.enum(['sm', 'md', 'lg'])

export const uiSchema = z.object({
  breakpoints: z.object({ mobile: z.number(), tablet: z.number(), desktop: z.number(), wide: z.number() }),
  sidePanel: z.object({ defaultWidth: widthToken }),
  table: z.object({ mobileCards: z.boolean(), skeletonRows: z.number().int().positive() }),
  skeleton: z.object({ rows: z.number().int().positive() }),
  toast: z.object({ durationMs: z.number().positive() }),
})

export const layoutSchema = z.object({
  contentMaxWidth: z.string().min(1),
  sidebar: z.object({ defaultCollapsed: z.boolean() }),
  aside: z.object({ width: widthToken, defaultOpen: z.boolean() }),
  dashboard: z.object({
    rows: z.array(z.array(z.string().min(1))).min(1),
    spans: z.record(z.string(), z.number().int().min(1).max(3)).optional(),
  }),
})

export const navigationSchema = z.object({
  routes: z.object({ home: z.string(), login: z.string(), logout: z.string(), afterLogin: z.string(), aliases: z.record(z.string(), z.string()) }),
  items: z.array(z.object({ to: z.string().startsWith('/'), labelKey: z.string(), permission: z.string().optional(), badge: z.string().optional() })),
})

/** Throws a readable error listing every problem found in the config files. */
export function validateConfig(files: { name: string; schema: z.ZodType; data: unknown }[]) {
  const problems: string[] = []
  for (const f of files) {
    const result = f.schema.safeParse(f.data)
    if (!result.success) {
      for (const issue of result.error.issues) problems.push(`${f.name}: ${issue.path.join('.') || '(root)'} — ${issue.message}`)
    }
  }
  if (problems.length > 0) throw new Error('Invalid configuration:\n' + problems.join('\n'))
}
