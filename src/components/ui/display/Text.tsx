import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Typography from the design tokens. Use instead of ad-hoc font sizes in components.
const textVariants = cva('', {
  variants: {
    variant: {
      title: 'text-2xl font-semibold tracking-tight text-foreground md:text-3xl',
      heading: 'text-lg font-semibold text-foreground',
      subtitle: 'text-sm text-muted-foreground',
      body: 'text-sm text-foreground',
      caption: 'text-xs text-muted-foreground',
      label: 'text-sm font-medium text-foreground',
      numeric: 'tabular text-2xl font-semibold text-foreground',
    },
  },
  defaultVariants: { variant: 'body' },
})

export interface TextProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4'
}

export function Text({ as: Tag = 'p', variant, className, ...props }: TextProps) {
  return <Tag className={cn(textVariants({ variant }), className)} {...(props as React.HTMLAttributes<HTMLElement>)} />
}
