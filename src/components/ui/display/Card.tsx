import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// default: bordered surface. outlined: bordered, no shadow. flat: tinted, no border.
// interactive: hover lift for clickable cards (use with a link or onClick).
const cardVariants = cva('rounded-lg bg-surface', {
  variants: {
    variant: {
      default: 'border shadow-card',
      outlined: 'border',
      flat: 'bg-muted/60',
      interactive: 'border shadow-card transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-base font-semibold leading-tight text-foreground', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-4 md:px-5', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-end gap-2 border-t px-4 py-3 md:px-5', className)} {...props} />
}
