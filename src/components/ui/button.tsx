import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/lib/ui-variants"
import { animateButtonHover } from "@/lib/animation-utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const [isHovered, setIsHovered] = React.useState(false)
    
    React.useEffect(() => {
      const el = buttonRef.current
      if (!el) return
      
      // Create animation
      let animation: any = null
      
      const startAnimation = () => {
        setIsHovered(true)
        animation = animateButtonHover(el)
      }
      
      const endAnimation = () => {
        setIsHovered(false)
        if (animation) {
          animation.pause()
          animation = null
        }
      }
      
      el.addEventListener('mouseenter', startAnimation)
      el.addEventListener('mouseleave', endAnimation)
      
      return () => {
        el.removeEventListener('mouseenter', startAnimation)
        el.removeEventListener('mouseleave', endAnimation)
        if (animation) animation.pause()
      }
    }, [])
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
ref={(node) => {
  buttonRef.current = node
  if (typeof ref === 'function') {
    ref(node)
  } else if (ref) {
    // Create a new object instead of modifying ref.current
    const newRef = { current: node }
    Object.assign(ref, newRef)
  }
}}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
