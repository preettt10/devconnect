// src/components/ui/Input.jsx
import { forwardRef } from 'react';

const Input = forwardRef(
  ({ label, error, hint, leftIcon, rightIcon, className = '', containerClass = '', ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1.5 ${containerClass}`}>
        {label && (
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={`input ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${
              error ? 'input-error' : ''
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef(
  ({ label, error, hint, className = '', containerClass = '', ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1.5 ${containerClass}`}>
        {label && (
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`input resize-none ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
