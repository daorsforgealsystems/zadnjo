import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'

/**
 * Modal (Compound Components Pattern)
 *
 * Usage:
 * <Modal.Root defaultOpen={false}>
 *   <Modal.Trigger>Open Modal</Modal.Trigger>
 *   <Modal.Overlay />
 *   <Modal.Content className="max-w-md">
 *     <Modal.Title>Title</Modal.Title>
 *     <Modal.Description>Description goes here.</Modal.Description>
 *     <div className="mt-6 flex justify-end gap-2">
 *       <Modal.Close className="btn">Close</Modal.Close>
 *     </div>
 *   </Modal.Content>
 * </Modal.Root>
 */

// Context for Modal state and accessibility ids
interface ModalContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  titleId: string
  descriptionId: string
}

const ModalContext = createContext<ModalContextValue | null>(null)

function useModalContext(component: string): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) {
    throw new Error(`${component} must be used within <Modal.Root>\n`)
  }
  return ctx
}

// Utilities
function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null
  return ReactDOM.createPortal(children, document.body)
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

// Root
export interface ModalRootProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Root({ open, defaultOpen, onOpenChange, children }: ModalRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(defaultOpen ?? false)
  const isControlled = open !== undefined
  const actualOpen = isControlled ? !!open : uncontrolledOpen

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  const titleId = useId()
  const descriptionId = useId()

  // Lock body scroll when open
  useEffect(() => {
    if (!actualOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [actualOpen])

  const value = useMemo(
    () => ({ open: actualOpen, setOpen, titleId, descriptionId }),
    [actualOpen, setOpen, titleId, descriptionId]
  )

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

// Trigger
export interface ModalTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

function Trigger({ asChild, children, ...buttonProps }: ModalTriggerProps) {
  const { setOpen } = useModalContext('Modal.Trigger')

  const onClick = useCallback<React.MouseEventHandler<HTMLElement>>(
    (e) => {
      if (buttonProps.onClick) buttonProps.onClick(e as any)
      if (e.defaultPrevented) return
      setOpen(true)
    },
    [buttonProps, setOpen]
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      onClick,
      ...('className' in (children as any).props
        ? { className: classNames((children as any).props.className) }
        : {}),
    })
  }

  return (
    <button type="button" {...buttonProps} onClick={onClick}>
      {children}
    </button>
  )
}

// Overlay
export interface ModalOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

function Overlay({ className, ...rest }: ModalOverlayProps) {
  const { open, setOpen } = useModalContext('Modal.Overlay')
  if (!open) return null

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (rest.onClick) rest.onClick(e)
    if (e.defaultPrevented) return
    setOpen(false)
  }

  return (
    <Portal>
      <div
        {...rest}
        onClick={handleClick}
        className={classNames(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] transition-opacity',
          className
        )}
      />
    </Portal>
  )
}

// Content
export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Close when pressing Escape (default: true) */
  closeOnEsc?: boolean
  /** Close when clicking outside (default: true). Requires <Modal.Overlay /> for UX. */
  closeOnOutsideClick?: boolean
}

function Content({ className, closeOnEsc = true, closeOnOutsideClick = true, ...rest }: ModalContentProps) {
  const { open, setOpen, titleId, descriptionId } = useModalContext('Modal.Content')
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open || !closeOnEsc) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, closeOnEsc, setOpen])

  if (!open) return null

  const onClickCapture: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // Prevent overlay click from closing when interacting inside content
    e.stopPropagation()
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          {...rest}
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onClickCapture={onClickCapture}
          className={classNames(
            'w-full rounded-lg bg-white p-6 shadow-xl outline-none dark:bg-neutral-900',
            'ring-1 ring-black/5 dark:ring-white/10',
            className
          )}
        />
      </div>
    </Portal>
  )
}

// Title
export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

function Title({ className, ...rest }: ModalTitleProps) {
  const { titleId } = useModalContext('Modal.Title')
  return (
    <h2
      id={titleId}
      {...rest}
      className={classNames('text-lg font-semibold leading-6', className)}
    />
  )
}

// Description
export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function Description({ className, ...rest }: ModalDescriptionProps) {
  const { descriptionId } = useModalContext('Modal.Description')
  return (
    <p id={descriptionId} {...rest} className={classNames('mt-1 text-sm text-neutral-600 dark:text-neutral-300', className)} />
  )
}

// Close
export interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function Close({ className, children = 'Close', ...rest }: ModalCloseProps) {
  const { setOpen } = useModalContext('Modal.Close')
  const onClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    rest.onClick?.(e)
    if (e.defaultPrevented) return
    setOpen(false)
  }
  return (
    <button type="button" {...rest} onClick={onClick} className={classNames('inline-flex items-center rounded-md border px-3 py-1.5 text-sm shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800', className)}>
      {children}
    </button>
  )
}

export const Modal = {
  Root,
  Trigger,
  Overlay,
  Content,
  Title,
  Description,
  Close,
}

export default Modal