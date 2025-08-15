import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import anime from 'animejs';

export interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'blur' | 'scale' | 'slide' | 'flip' | 'zoom' | 'bounce' | 'fade';
  animation?: 'spring' | 'ease' | 'linear';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  preventScroll?: boolean;
  centerContent?: boolean;
  fullHeight?: boolean;
  customPosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  onAnimationComplete?: () => void;
  onAnimationStart?: () => void;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  loading?: boolean;
}

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full h-full'
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  default: {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  },
  blur: {
    hidden: { opacity: 0, scale: 1.1, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      scale: 1, 
      filter: 'blur(0px)',
      transition: { duration: 0.3 }
    },
    exit: { opacity: 0, scale: 0.9, filter: 'blur(10px)' }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.3 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', stiffness: 400, damping: 25 }
    },
    exit: { opacity: 0, scale: 0.3 }
  },
  slide: {
    hidden: { opacity: 0, x: 0, y: '100%' },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { opacity: 0, y: '100%' }
  },
  flip: {
    hidden: { opacity: 0, rotateX: -90 },
    visible: { 
      opacity: 1, 
      rotateX: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    },
    exit: { opacity: 0, rotateX: 90 }
  },
  zoom: {
    hidden: { opacity: 0, scale: 0 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: 'spring', 
        stiffness: 200, 
        damping: 15,
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0,
      transition: { duration: 0.2 }
    }
  },
  bounce: {
    hidden: { opacity: 0, scale: 0.3, y: -100 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 10,
        bounce: 0.6
      }
    },
    exit: { opacity: 0, scale: 0.3, y: 100 }
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { opacity: 0 }
  }
};

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'md',
  variant = 'default',
  animation = 'spring',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
  contentClassName,
  preventScroll = true,
  centerContent = true,
  fullHeight = false,
  customPosition,
  onAnimationComplete,
  onAnimationStart,
  footer,
  header,
  loading = false,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }

      // Focus trap
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements?.length) {
        (focusableElements[0] as HTMLElement).focus();
      }
    } else {
      if (preventScroll) {
        document.body.style.overflow = '';
      }
      
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, preventScroll]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const handleAnimationStart = () => {
    onAnimationStart?.();
  };

  const handleAnimationComplete = () => {
    onAnimationComplete?.();
    
    // Add entrance animation for content
    if (isOpen && modalRef.current) {
      const contentElements = modalRef.current.querySelectorAll('[data-animate-content]');
      if (contentElements.length > 0) {
        anime({
          targets: contentElements,
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 400,
          delay: anime.stagger(50),
          easing: 'easeOutQuad'
        });
      }
    }
  };

  if (!isMounted) {
    return null;
  }

  const modalContent = (
    <AnimatePresence mode="wait" onExitComplete={() => handleAnimationComplete()}>
      {isOpen && (
        <motion.div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            centerContent ? 'p-4' : '',
            !centerContent && customPosition && 'items-start justify-start'
          )}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          onAnimationStart={handleAnimationStart}
          onAnimationComplete={handleAnimationComplete}
        >
          {/* Backdrop */}
          <motion.div
            className={cn(
              'absolute inset-0 bg-black/50 backdrop-blur-sm',
              variant === 'blur' && 'backdrop-blur-md',
              overlayClassName
            )}
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            className={cn(
              'relative bg-background rounded-lg shadow-xl',
              'max-h-[90vh] overflow-y-auto',
              modalSizes[size],
              fullHeight && 'h-full',
              'focus:outline-none',
              className
            )}
            style={{
              ...(customPosition && {
                position: 'absolute',
                ...customPosition
              })
            }}
            variants={modalVariants[variant]}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              type: animation,
              duration: animation === 'linear' ? 0.2 : undefined
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
          >
            {/* Header */}
            {(title || showCloseButton || header) && (
              <div className={cn(
                'flex items-center justify-between p-6 border-b',
                loading && 'opacity-50'
              )}>
                <div className="flex-1">
                  {header || (
                    <div>
                      {title && (
                        <h2 
                          id="modal-title" 
                          className="text-lg font-semibold text-foreground"
                          data-animate-content
                        >
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p 
                          id="modal-description" 
                          className="mt-1 text-sm text-muted-foreground"
                          data-animate-content
                        >
                          {description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-4 h-8 w-8"
                    onClick={onClose}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={cn(
              'p-6',
              !title && !header && 'pt-6',
              !footer && 'pb-6',
              loading && 'opacity-50 pointer-events-none',
              contentClassName
            )}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <div data-animate-content>
                  {children}
                </div>
              )}
            </div>

            {/* Footer */}
            {footer && (
              <div className={cn(
                'flex items-center justify-end gap-3 p-6 border-t bg-muted/20',
                loading && 'opacity-50'
              )}>
                <div data-animate-content>
                  {footer}
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <motion.div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

// Specialized modal variants
export const BlurModal: React.FC<Omit<AnimatedModalProps, 'variant'>> = (props) => (
  <AnimatedModal variant="blur" {...props} />
);

export const SlideModal: React.FC<Omit<AnimatedModalProps, 'variant'>> = (props) => (
  <AnimatedModal variant="slide" {...props} />
);

export const ScaleModal: React.FC<Omit<AnimatedModalProps, 'variant'>> = (props) => (
  <AnimatedModal variant="scale" {...props} />
);

export const BounceModal: React.FC<Omit<AnimatedModalProps, 'variant'>> = (props) => (
  <AnimatedModal variant="bounce" {...props} />
);

export const ZoomModal: React.FC<Omit<AnimatedModalProps, 'variant'>> = (props) => (
  <AnimatedModal variant="zoom" {...props} />
);

// Confirmation Modal with built-in buttons
export interface ConfirmModalProps extends Omit<AnimatedModalProps, 'children' | 'footer'> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmVariant?: 'default' | 'destructive' | 'outline';
  showCancel?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'default',
  showCancel = true,
  onClose,
  ...props
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <AnimatedModal
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {showCancel && (
            <Button variant="outline" onClick={handleCancel}>
              {cancelText}
            </Button>
          )}
          <Button variant={confirmVariant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      }
      {...props}
    >
      <p className="text-foreground">{message}</p>
    </AnimatedModal>
  );
};