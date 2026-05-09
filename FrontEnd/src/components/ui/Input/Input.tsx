import React, { useState, useRef, useEffect } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  hint?: string | null
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const { label, error = null, hint = null, leftIcon, rightIcon, fullWidth = false, value, defaultValue, onChange, type = 'text', ...rest } = props
  const [focused, setFocused] = useState(false)
  const internalRef = useRef<HTMLInputElement | null>(null)
  const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef

  const isFilled = (): boolean => {
    const currentVal = (inputRef && inputRef.current && inputRef.current.value) ?? value ?? defaultValue
    return Boolean(currentVal && String(currentVal).length > 0)
  }

  const [filled, setFilled] = useState<boolean>(Boolean(value ?? defaultValue))

  useEffect(() => {
    setFilled(isFilled())
  }, [value, defaultValue])

  const wrapperClass = [
    fullWidth ? 'w-full' : '',
    'space-y-1',
  ].filter(Boolean).join(' ')

  const controlClass = [
    'relative rounded-xl border transition-all',
    error ? 'border-destructive bg-destructive/5' : 'border-border bg-muted',
    focused ? 'ring-2 ring-primary border-primary' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={wrapperClass}>
      <div className={controlClass}>
        {leftIcon ? <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{leftIcon}</span> : null}
        <input
          ref={inputRef as any}
          className={`w-full rounded-xl bg-transparent py-3 pr-3 focus:outline-none ${leftIcon ? 'pl-10' : 'pl-3'} ${rightIcon ? 'pr-10' : ''}`}
          type={type}
          aria-invalid={Boolean(error)}
          aria-label={label}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setFilled(isFilled()) }}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          {...rest}
        />
        {rightIcon ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{rightIcon}</span> : null}
        <label className={`pointer-events-none absolute left-3 transition-all ${filled || focused ? 'top-1 text-[10px] text-muted-foreground' : 'top-1/2 -translate-y-1/2 text-sm text-muted-foreground'} ${leftIcon ? 'left-10' : ''}`}>
          {label}
        </label>
      </div>
      {error ? <div role="alert" className="text-xs text-destructive">{error}</div> : hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  )
})

export default Input
