import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Variant names follow the design brief: primary, secondary, ghost, danger, success, link.
// The older names (default, destructive, warning, soft) remain as aliases so existing screens keep working.
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
        secondary: 'border border-input bg-surface text-foreground shadow-sm hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        danger: 'bg-danger text-white shadow-sm hover:bg-danger/90 dark:text-background',
        destructive: 'bg-danger text-white shadow-sm hover:bg-danger/90 dark:text-background',
        success: 'bg-success text-white shadow-sm hover:bg-success/90 dark:text-background',
        warning: 'bg-warning text-white shadow-sm hover:bg-warning/90 dark:text-background',
        soft: 'bg-primary-soft text-primary hover:bg-primary/15',
        link: 'text-primary underline-offset-4 hover:underline px-0',
      },
      size: {
        sm: 'h-10 px-3 text-sm md:h-8 md:text-xs',
        md: 'h-11 px-4 md:h-10',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11 md:size-9',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', fullWidth: false },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, loading = false, disabled, type, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, fullWidth }), className)
    // Slot needs exactly one child element, so asChild passes the child through untouched.
    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...props}>
          {children}
        </Slot>
      )
    }
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {loading && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export const IconButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'> & { 'aria-label': string }>(
  ({ variant = 'ghost', ...props }, ref) => <Button ref={ref} variant={variant} size="icon" {...props} />,
)
IconButton.displayName = 'IconButton'
