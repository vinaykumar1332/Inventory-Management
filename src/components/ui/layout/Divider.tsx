import * as React from 'react'
import { cn } from '@/lib/utils'

export function Divider({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('my-4 border-border', className)} {...props} />
}
