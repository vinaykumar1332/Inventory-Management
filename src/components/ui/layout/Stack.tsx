import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Vertical or horizontal spacing using the space tokens (space-1 = 0.25rem ... space-12 = 3rem).
const stackVariants = cva('flex', {
  variants: {
    direction: { column: 'flex-col', row: 'flex-row flex-wrap' },
    gap: {
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
    },
    align: { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' },
  },
  defaultVariants: { direction: 'column', gap: 4, align: 'stretch' },
})

export interface StackProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof stackVariants> {}

export function Stack({ className, direction, gap, align, ...props }: StackProps) {
  return <div className={cn(stackVariants({ direction, gap, align }), className)} {...props} />
}
