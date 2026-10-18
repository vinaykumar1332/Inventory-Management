import * as React from 'react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger
export const DropdownMenuRadioGroup = Menu.RadioGroup

export function DropdownMenuContent({
  className,
  align = 'end',
  children,
}: {
  className?: string
  align?: 'start' | 'center' | 'end'
  children: React.ReactNode
}) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        sideOffset={6}
        className={cn('z-50 min-w-48 overflow-hidden rounded-lg border bg-surface p-1 text-sm shadow-lg data-[state=open]:animate-fade-in', className)}
      >
        {children}
      </Menu.Content>
    </Menu.Portal>
  )
}

export function DropdownMenuItem({ className, danger, ...props }: React.ComponentPropsWithoutRef<typeof Menu.Item> & { danger?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        'flex min-h-10 cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-muted data-[disabled]:opacity-50 md:min-h-9 [&_svg]:size-4 [&_svg]:text-muted-foreground',
        danger && 'text-danger [&_svg]:text-danger',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof Menu.Label>) {
  return <Menu.Label className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)} {...props} />
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className="my-1 h-px bg-border" />
}

export function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem
      className={cn(
        'flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 outline-none data-[highlighted]:bg-muted data-[state=checked]:font-semibold data-[state=checked]:text-primary md:min-h-9',
        className,
      )}
      {...props}
    >
      <span className="flex size-4 items-center justify-center">
        <Menu.ItemIndicator>
          <span className="block size-2 rounded-full bg-primary" />
        </Menu.ItemIndicator>
      </span>
      {children}
    </Menu.RadioItem>
  )
}
