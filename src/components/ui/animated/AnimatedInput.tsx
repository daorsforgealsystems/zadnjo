import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import anime from 'animejs';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  variant?: 'default' | 'floating' | 'underline' | 'outlined' | 'filled';
  animation?: 'slide' | 'fade' | 'bounce' | 'scale' | 'glow';
  focusColor?: string;
  errorColor?: string;
  successColor?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showValidation?: boolean;
  loading?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
}

const inputVariants = {
  default: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    focus: { scale: 1.02 },
    error: { x: [-5, 5, -5, 5, 0] }
  },
  floating: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    focus: { y: -2 },
    error: { x: [-3, 3, -3, 3, 0] }
  },
  underline: {
    initial: { opacity: 0, scaleX: 0 },
    animate: { opacity: 1, scaleX: 1 },
    focus: { scaleX: 1.02 },
    error: { scaleX: [1, 1.05, 1] }
  },
  outlined: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    focus: { scale: 1.01, borderColor: '#3b82f6' },
    error: { scale: [1, 1.02, 1] }
  },
  filled: {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    focus: { y: -1 },
    error: { y: [0, -2, 0, -2, 0] }
  }
};

const animationVariants = {
  slide: { x: [-20, 0], opacity: [0, 1] },
  fade: { opacity: [0, 1] },
  bounce: { scale: [0.8, 1.1, 1], opacity: [0, 1] },
  scale: { scale: [0.9, 1], opacity: [0, 1] },
  glow: { opacity: [0, 1] }
};

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(({
  className,
  label,
  error,
  success,
  hint,
  variant = 'default',
  animation = 'slide',
  focusColor = '#3b82f6',
  errorColor = '#ef4444',
  successColor = '#10b981',
  leftIcon,
  rightIcon,
  showValidation = true,
  loading = false,
  onValidationChange,
  validation,
  type,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Combine refs
  const combinedRef = (node: HTMLInputElement) => {
    inputRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  // Validation logic
  const validateInput = (inputValue: string) => {
    if (!validation) return null;

    if (validation.required && !inputValue.trim()) {
      return 'This field is required';
    }

    if (validation.minLength && inputValue.length < validation.minLength) {
      return `Minimum ${validation.minLength} characters required`;
    }

    if (validation.maxLength && inputValue.length > validation.maxLength) {
      return `Maximum ${validation.maxLength} characters allowed`;
    }

    if (validation.pattern && !validation.pattern.test(inputValue)) {
      return 'Invalid format';
    }

    if (validation.custom) {
      return validation.custom(inputValue);
    }

    return null;
  };

  // Handle value change
  useEffect(() => {
    if (hasInteracted && value !== undefined) {
      const validationResult = validateInput(String(value));
      setValidationError(validationResult);
      setIsValid(!validationResult);
      onValidationChange?.(!validationResult);
    }
  }, [value, hasInteracted, validation]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setHasInteracted(true);
    
    // Floating label animation
    if (variant === 'floating' && labelRef.current) {
      anime({
        targets: labelRef.current,
        translateY: -20,
        scale: 0.85,
        color: focusColor,
        duration: 200,
        easing: 'easeOutQuad'
      });
    }

    // Glow effect
    if (animation === 'glow' && wrapperRef.current) {
      anime({
        targets: wrapperRef.current,
        boxShadow: `0 0 0 2px ${focusColor}40`,
        duration: 200,
        easing: 'easeOutQuad'
      });
    }

    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    const inputValue = e.target.value;
    
    // Floating label animation
    if (variant === 'floating' && labelRef.current) {
      if (!inputValue) {
        anime({
          targets: labelRef.current,
          translateY: 0,
          scale: 1,
          color: '#6b7280',
          duration: 200,
          easing: 'easeOutQuad'
        });
      }
    }

    // Remove glow effect
    if (animation === 'glow' && wrapperRef.current) {
      anime({
        targets: wrapperRef.current,
        boxShadow: '0 0 0 0px transparent',
        duration: 200,
        easing: 'easeOutQuad'
      });
    }

    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
  };

  // Error shake animation
  useEffect(() => {
    if (error || validationError) {
      if (inputRef.current) {
        anime({
          targets: inputRef.current,
          translateX: [-5, 5, -5, 5, 0],
          duration: 400,
          easing: 'easeOutQuad'
        });
      }
    }
  }, [error, validationError]);

  const currentError = error || validationError;
  const hasError = !!(currentError && hasInteracted);
  const hasSuccess = !!(success && isValid && hasInteracted);

  const inputClassName = cn(
    'transition-all duration-200',
    variant === 'underline' && 'border-0 border-b-2 rounded-none bg-transparent px-0',
    variant === 'filled' && 'bg-muted border-0',
    variant === 'outlined' && 'border-2',
    hasError && `border-red-500 focus:border-red-500`,
    hasSuccess && `border-green-500 focus:border-green-500`,
    leftIcon && 'pl-10',
    (rightIcon || type === 'password' || showValidation) && 'pr-10',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  const wrapperClassName = cn(
    'relative',
    variant === 'floating' && 'pt-6'
  );

  const labelClassName = cn(
    'transition-all duration-200',
    variant === 'floating' && 'absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground',
    hasError && 'text-red-500',
    hasSuccess && 'text-green-500',
    isFocused && variant !== 'floating' && 'text-blue-500'
  );

  return (
    <motion.div
      ref={wrapperRef}
      className={wrapperClassName}
      initial="initial"
      animate="animate"
      variants={inputVariants[variant]}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Label */}
      {label && variant !== 'floating' && (
        <Label className={labelClassName} htmlFor={props.id}>
          {label}
          {validation?.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}

        {/* Floating Label */}
        {label && variant === 'floating' && (
          <label
            ref={labelRef}
            className={labelClassName}
            htmlFor={props.id}
          >
            {label}
            {validation?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input */}
        <motion.div
          initial={animationVariants[animation]}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Input
            ref={combinedRef}
            className={inputClassName}
            type={type === 'password' && showPassword ? 'text' : type}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled || loading}
            {...props}
          />
        </motion.div>

        {/* Right Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* Loading Spinner */}
          {loading && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          )}

          {/* Validation Icons */}
          {showValidation && hasInteracted && !loading && (
            <AnimatePresence mode="wait">
              {hasError && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </motion.div>
              )}
              {hasSuccess && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Password Toggle */}
          {type === 'password' && !loading && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Custom Right Icon */}
          {rightIcon && !loading && type !== 'password' && rightIcon}
        </div>
      </div>

      {/* Helper Text */}
      <AnimatePresence mode="wait">
        {(currentError || success || hint) && hasInteracted && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1"
          >
            {hasError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {currentError}
              </p>
            )}
            {hasSuccess && (
              <p className="text-sm text-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {success}
              </p>
            )}
            {!hasError && !hasSuccess && hint && (
              <p className="text-sm text-muted-foreground">{hint}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Underline Effect for Underline Variant */}
      {variant === 'underline' && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ transformOrigin: 'left' }}
        />
      )}
    </motion.div>
  );
});

AnimatedInput.displayName = 'AnimatedInput';

// Specialized input variants
export const FloatingLabelInput = forwardRef<HTMLInputElement, Omit<AnimatedInputProps, 'variant'>>((props, ref) => (
  <AnimatedInput ref={ref} variant="floating" {...props} />
));

export const UnderlineInput = forwardRef<HTMLInputElement, Omit<AnimatedInputProps, 'variant'>>((props, ref) => (
  <AnimatedInput ref={ref} variant="underline" {...props} />
));

export const OutlinedInput = forwardRef<HTMLInputElement, Omit<AnimatedInputProps, 'variant'>>((props, ref) => (
  <AnimatedInput ref={ref} variant="outlined" {...props} />
));

export const FilledInput = forwardRef<HTMLInputElement, Omit<AnimatedInputProps, 'variant'>>((props, ref) => (
  <AnimatedInput ref={ref} variant="filled" {...props} />
));

FloatingLabelInput.displayName = 'FloatingLabelInput';
UnderlineInput.displayName = 'UnderlineInput';
OutlinedInput.displayName = 'OutlinedInput';
FilledInput.displayName = 'FilledInput';