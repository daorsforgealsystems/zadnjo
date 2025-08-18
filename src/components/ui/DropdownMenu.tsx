import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'

/**
 * DropdownMenu (Compound Components Pattern)
 *
 * Usage:
 * <DropdownMenu.Root>
 *   <DropdownMenu.Trigger className="btn">Open</DropdownMenu.Trigger>
 *   <DropdownMenu.Content align="start">
 *     <DropdownMenu.Label>Actions</DropdownMenu.Label>
 *     <DropdownMenu.Item onSelect={() => alert('Edit')}>Edit</DropdownMenu.Item>
 *     <DropdownMenu.Item onSelect={() => alert('Duplicate')}>Duplicate</DropdownMenu.Item>
 *     <DropdownMenu.Separator />
 *     <DropdownMenu.Item disabled onSelect={() => {}}>Disabled</DropdownMenu.Item>
 *     <DropdownMenu.Item onSelect={() => alert('Delete')}>Delete</DropdownMenu.Item>
 *   </DropdownMenu.Content>
 * </DropdownMenu.Root>
 */

// Utils
function classNames(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(' ')
}

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null
  return ReactDOM.createPortal(children, document.body)
}

// Contexts
interface DropdownContextValue {
  open: boolean
  setOpen: (o: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
}
const DropdownContext = createContext<DropdownContextValue | null>(null)
function useDropdownContext(component: string): DropdownContextValue {
  const ctx = useContext(DropdownContext)
  if (!ctx) throw new Error(`${component} must be used within <DropdownMenu.Root>`)
  return ctx
}

interface RovingContextValue {
  registerItem: (entry: ItemEntry) => () => void
  moveFocus: (dir: 1 | -1, from?: HTMLElement | null) => void
}
const RovingContext = createContext<RovingContextValue | null>(null)
function useRovingContext(): RovingContextValue {
  const ctx = useContext(RovingContext)
  if (!ctx) throw new Error('DropdownMenu internals misused: missing RovingContext')
  return ctx
}

interface ItemEntry { ref: React.RefObject<HTMLDivElement>; disabled?: boolean; index: number }

// Root
export interface DropdownRootProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Root({ open, defaultOpen, onOpenChange, children }: DropdownRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(defaultOpen ?? false)
  const isControlled = open !== undefined
  const actualOpen = isControlled ? !!open : uncontrolledOpen
  const triggerRef = useRef<HTMLElement>(null)

  const setOpen = useCallback(
    (o: boolean) => {
      if (!isControlled) setUncontrolledOpen(o)
      onOpenChange?.(o)
    },
    [isControlled, onOpenChange]
  )

  // Close on outside click
  useEffect(() => {
    if (!actualOpen) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!triggerRef.current) return
      const contentEl = document.getElementById(_CONTENT_ID)
      if (triggerRef.current.contains(t) || (contentEl && contentEl.contains(t))) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [actualOpen, setOpen])

  const value = useMemo<DropdownContextValue>(() => ({ open: actualOpen, setOpen, triggerRef }), [actualOpen, setOpen])
  return <DropdownContext.Provider value={value}>{children}</DropdownContext.Provider>
}

// Trigger
export interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}
export function Trigger({ asChild, children, onClick, ...buttonProps }: DropdownTriggerProps) {
  const { open, setOpen, triggerRef } = useDropdownContext('DropdownMenu.Trigger')

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    onClick?.(e as any)
    if (e.defaultPrevented) return
    setOpen(!open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      ref: (node: HTMLElement) => {
        // @ts-ignore
        if (typeof (children as any).ref === 'function') (children as any).ref(node)
        // @ts-ignore
        else if ((children as any).ref) (children as any).ref.current = node
        ;(triggerRef as any).current = node
      },
      onClick: handleClick,
    })
  }

  return (
    <button
      type="button"
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      {...buttonProps}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

// Content
const _CONTENT_ID = 'dropdown-content-root'

export interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
}

export function Content({ className, style, align = 'start', onKeyDown, children, ...rest }: DropdownContentProps) {
  const { open, setOpen, triggerRef } = useDropdownContext('DropdownMenu.Content')
  const contentRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<ItemEntry[]>([])
  const nextIndex = useRef(0)

  const registerItem = useCallback((entry: ItemEntry) => {
    itemsRef.current = [...itemsRef.current, entry].sort((a, b) => a.index - b.index)
    return () => {
      itemsRef.current = itemsRef.current.filter((e) => e !== entry)
    }
  }, [])

  const moveFocus = useCallback((dir: 1 | -1, from?: HTMLElement | null) => {
    const items = itemsRef.current.filter((i) => !i.disabled)
    if (items.length === 0) return
    let idx = 0
    if (from) {
      idx = items.findIndex((i) => i.ref.current === from)
      if (idx === -1) idx = 0
    }
    const next = items[(idx + dir + items.length) % items.length]
    next.ref.current?.focus()
  }, [])

  // Positioning under trigger
  useLayoutEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    const content = contentRef.current
    if (!trigger || !content) return
    const rect = trigger.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    const top = rect.bottom + window.scrollY + 4 // small offset
    let left = rect.left + window.scrollX
    if (align === 'center') left = rect.left + window.scrollX + rect.width / 2 - contentRect.width / 2
    if (align === 'end') left = rect.right + window.scrollX - contentRect.width
    content.style.top = `${top}px`
    content.style.left = `${Math.max(8, left)}px`
  }, [open, align, triggerRef])

  // Keyboard handling
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      ;(triggerRef.current as HTMLElement | null)?.focus()
      return
    }
    const active = document.activeElement as HTMLElement | null
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveFocus(1, active)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveFocus(-1, active)
    } else if (e.key === 'Home') {
      e.preventDefault()
      const first = itemsRef.current.find((i) => !i.disabled)
      first?.ref.current?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      const last = [...itemsRef.current].reverse().find((i) => !i.disabled)
      last?.ref.current?.focus()
    }
  }

  if (!open) return null

  const rovingValue = useMemo<RovingContextValue>(() => ({ registerItem, moveFocus }), [registerItem, moveFocus])

  return (
    <Portal>
      <div id={_CONTENT_ID} />
      <div
        {...rest}
        ref={contentRef}
        role="menu"
        tabIndex={-1}
        className={classNames(
          'fixed z-50 min-w-[160px] rounded-md border bg-white p-1 shadow-md outline-none dark:border-white/10 dark:bg-neutral-900',
          className
        )}
        style={{ position: 'fixed', ...style }}
        onKeyDown={handleKeyDown}
      >
        <RovingContext.Provider value={rovingValue}>{children}</RovingContext.Provider>
      </div>
    </Portal>
  )
}

// Label
export interface DropdownLabelProps extends React.HTMLAttributes<HTMLDivElement> {}
export function Label({ className, ...rest }: DropdownLabelProps) {
  return (
    <div {...rest} className={classNames('px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400', className)} />
  )
}

// Separator
export interface DropdownSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}
export function Separator({ className, ...rest }: DropdownSeparatorProps) {
  return <div role="separator" {...rest} className={classNames('my-1 h-px bg-neutral-200 dark:bg-white/10', className)} />
}

// Item
export interface DropdownItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean
  onSelect?: () => void
}

export function Item({ className, disabled, onClick, onKeyDown, onSelect, ...rest }: DropdownItemProps) {
  const { setOpen, triggerRef } = useDropdownContext('DropdownMenu.Item')
  const { registerItem, moveFocus } = useRovingContext()
  const ref = useRef<HTMLDivElement>(null)
  const index = useRef<number>(-1)
  if (index.current === -1) index.current = _nextIndex()

  useEffect(() => {
    return registerItem({ ref, disabled, index: index.current })
  }, [registerItem, disabled])

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    onClick?.(e)
    if (e.defaultPrevented || disabled) return
    onSelect?.()
    setOpen(false)
    ;(triggerRef.current as HTMLElement | null)?.focus()
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.()
      setOpen(false)
      ;(triggerRef.current as HTMLElement | null)?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveFocus(1, ref.current)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveFocus(-1, ref.current)
    }
  }

  return (
    <div
      role="menuitem"
      ref={ref}
      tabIndex={disabled ? -1 : -1}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={classNames(
        'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
        disabled
          ? 'opacity-50'
          : 'hover:bg-neutral-100 focus:bg-neutral-100 active:bg-neutral-100 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 dark:active:bg-neutral-800',
        className
      )}
      {...rest}
    />
  )
}

let __index = 0
function _nextIndex() {
  return __index++
}

export const DropdownMenu = { Root, Trigger, Content, Item, Separator, Label }
export default DropdownMenu