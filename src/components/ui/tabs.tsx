import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'

/**
 * Tabs (Compound Components Pattern)
 *
 * Usage:
 * <Tabs.Root defaultValue="tab-1">
 *   <Tabs.List>
 *     <Tabs.Trigger value="tab-1">Tab One</Tabs.Trigger>
 *     <Tabs.Trigger value="tab-2">Tab Two</Tabs.Trigger>
 *     <Tabs.Trigger value="tab-3">Tab Three</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Content value="tab-1">Content 1</Tabs.Content>
 *   <Tabs.Content value="tab-2">Content 2</Tabs.Content>
 *   <Tabs.Content value="tab-3">Content 3</Tabs.Content>
 * </Tabs.Root>
 */

// Context types
interface TabsContextValue {
  value: string | null
  setValue: (next: string) => void
  orientation: 'horizontal' | 'vertical'
  // Registration for keyboard nav
  registerTrigger: (entry: TriggerEntry) => () => void
  getOrderedTriggers: () => TriggerEntry[]
  getIdsForValue: (value: string) => { tabId: string; panelId: string }
}

interface TriggerEntry {
  value: string
  ref: React.RefObject<HTMLButtonElement | null>
  indexHint: number // used to preserve DOM order
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error(`${component} must be used within <Tabs.Root>`)
  return ctx
}

function classNames(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(' ')
}

// Root
export interface TabsRootProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  children: React.ReactNode
}

export function Root({ value, defaultValue, onValueChange, orientation = 'horizontal', children }: TabsRootProps) {
  const [uncontrolled, setUncontrolled] = useState<string | null>(defaultValue ?? null)
  const isControlled = value !== undefined
  const actual = isControlled ? (value ?? null) : uncontrolled

  const triggersRef = useRef<TriggerEntry[]>([])
  const indexCounter = useRef(0)

  const registerTrigger = useCallback((entry: TriggerEntry) => {
    triggersRef.current = [...triggersRef.current, entry].sort((a, b) => a.indexHint - b.indexHint)
    return () => {
      triggersRef.current = triggersRef.current.filter((e) => e !== entry)
    }
  }, [])

  const getOrderedTriggers = useCallback(() => triggersRef.current, [])

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolled(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange]
  )

  const idsMapRef = useRef(new Map<string, { tabId: string; panelId: string }>())
  const getIdsForValue = useCallback((val: string) => {
    const existing = idsMapRef.current.get(val)
    if (existing) return existing
    const ids = { tabId: `tab-${val}-${Math.random().toString(36).slice(2)}`, panelId: `panel-${val}-${Math.random().toString(36).slice(2)}` }
    idsMapRef.current.set(val, ids)
    return ids
  }, [])

  const valueObj = useMemo<TabsContextValue>(
    () => ({ value: actual, setValue, orientation, registerTrigger, getOrderedTriggers, getIdsForValue }),
    [actual, setValue, orientation, registerTrigger, getOrderedTriggers, getIdsForValue]
  )

  // Ensure we always have a selected tab when first trigger registers
  useEffect(() => {
    if (actual == null && triggersRef.current.length > 0) {
      setValue(triggersRef.current[0].value)
    }
  }, [actual, setValue])

  // Provide a way for Trigger to request a stable index
  const IndexContext = React.useMemo(() => ({ nextIndex: () => indexCounter.current++ }), [])

  return (
    <TabsContext.Provider value={valueObj}>
      {/* Pass hidden context via React context composition */}
      <_IndexContext.Provider value={IndexContext}>{children}</_IndexContext.Provider>
    </TabsContext.Provider>
  )
}

// Internal: index provider to keep order on mount
const _IndexContext = createContext<{ nextIndex: () => number } | null>(null)
function useIndexHint() {
  const ctx = useContext(_IndexContext)
  const idRef = useRef<number | null>(null)
  if (!ctx) throw new Error('Tabs internals misused: missing _IndexContext')
  if (idRef.current === null) idRef.current = ctx.nextIndex()
  return idRef.current
}

// List
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}
export function List({ className, ...rest }: TabsListProps) {
  const { orientation } = useTabsContext('Tabs.List')
  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      {...rest}
      className={classNames('flex gap-2', orientation === 'vertical' && 'flex-col', className)}
    />
  )
}

// Trigger
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function Trigger({ value, className, onClick, onKeyDown, ...buttonProps }: TabsTriggerProps) {
  const { value: selected, setValue, orientation, registerTrigger, getOrderedTriggers, getIdsForValue } = useTabsContext('Tabs.Trigger')
  const ref = useRef<HTMLButtonElement>(null)
  const indexHint = useIndexHint()

  // Register for keyboard navigation
  useEffect(() => {
    return registerTrigger({ value, ref, indexHint })
  }, [registerTrigger, value, indexHint])

  const { tabId, panelId } = getIdsForValue(value)
  const selectedBool = selected === value

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    setValue(value)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    const list = getOrderedTriggers()
    const currentIdx = list.findIndex((t) => t.value === value)
    if (currentIdx < 0) return

    const isHorizontal = orientation === 'horizontal'
    const key = e.key

    const focusAndSelect = (idx: number) => {
      const next = list[(idx + list.length) % list.length]
      next.ref.current?.focus()
      setValue(next.value)
    }

    if ((isHorizontal && key === 'ArrowRight') || (!isHorizontal && key === 'ArrowDown')) {
      e.preventDefault()
      focusAndSelect(currentIdx + 1)
    } else if ((isHorizontal && key === 'ArrowLeft') || (!isHorizontal && key === 'ArrowUp')) {
      e.preventDefault()
      focusAndSelect(currentIdx - 1)
    } else if (key === 'Home') {
      e.preventDefault()
      focusAndSelect(0)
    } else if (key === 'End') {
      e.preventDefault()
      focusAndSelect(list.length - 1)
    }
  }

  return (
    <button
      ref={ref}
      id={tabId}
      type="button"
      role="tab"
      aria-selected={selectedBool}
      aria-controls={panelId}
      tabIndex={selectedBool ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={classNames(
        'rounded-md px-3 py-1.5 text-sm outline-offset-2',
        selectedBool
          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700',
        className
      )}
      {...buttonProps}
    />
  )
}

// Content
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function Content({ value, className, ...rest }: TabsContentProps) {
  const { value: selected, getIdsForValue } = useTabsContext('Tabs.Content')
  const { panelId, tabId } = getIdsForValue(value)
  const hidden = selected !== value

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      hidden={hidden}
      {...rest}
      className={classNames('mt-3', className)}
    />
  )
}

export const Tabs = { Root, List, Trigger, Content }
export default Tabs