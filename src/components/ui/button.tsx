import type { ButtonHTMLAttributes, FC, ReactNode } from 'react'

type UiButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  children?: ReactNode
}

export const UiButton: FC<UiButtonProps> = ({ variant = 'primary', className = '', children, ...rest }) => {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition duration-150 ease-in-out'
  const variants: Record<string, string> = {
    primary: `${base} bg-primary text-primary-foreground hover:opacity-95 focus:ring-2 focus:ring-primary/30 shadow-sm`,
    ghost: `${base} bg-transparent text-foreground hover:bg-muted/40`,
  }

  return (
    <button className={`${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export default UiButton
import React, { forwardRef } from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/lib/ui-variants"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
