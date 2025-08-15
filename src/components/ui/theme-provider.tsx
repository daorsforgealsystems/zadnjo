"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"
import { animateThemeChange } from "@/lib/animation-utils"

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
const { theme } = props as { theme?: string }
  
  React.useEffect(() => {
    if (theme) {
      // Use requestAnimationFrame to ensure the theme class is applied
      requestAnimationFrame(() => {
        animateThemeChange()
      })
    }
  }, [theme])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
