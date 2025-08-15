import * as React from "react"

import { cn } from "@/lib/utils"
import { animateInputFocus } from "@/lib/animation-utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    React.useEffect(() => {
      const el = inputRef.current
      if (!el) return
      
      // Animation instance
      let animation: any = null
      
      const handleFocus = () => {
        animation = animateInputFocus(el)
      }
      
      const handleBlur = () => {
        if (animation) {
          animation.pause()
          animation = null
        }
      }
      
      el.addEventListener('focus', handleFocus)
      el.addEventListener('blur', handleBlur)
      
      return () => {
        el.removeEventListener('focus', handleFocus)
        el.removeEventListener('blur', handleBlur)
        if (animation) animation.pause()
      }
    }, [])
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
ref={(node) => {
  inputRef.current = node
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
Input.displayName = "Input"

export { Input }
