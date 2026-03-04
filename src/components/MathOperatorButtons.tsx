import { useEffect, useRef } from 'react'
import { evaluateExpression } from '@/lib/constants'

const OPERATORS = [
  { label: '+', value: '+' },
  { label: '−', value: '-' },
  { label: '×', value: '*' },
  { label: '÷', value: '/' },
] as const

function setNativeInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

export function MathOperatorButtons() {
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Track whichever [data-math-input] was last focused
  useEffect(() => {
    // Catch any input that gained focus before this listener was set up (e.g. via autoFocus)
    const active = document.activeElement
    if (active instanceof HTMLInputElement && active.hasAttribute('data-math-input')) {
      inputRef.current = active
    }

    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as HTMLElement).hasAttribute?.('data-math-input')) {
        inputRef.current = e.target as HTMLInputElement
      }
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }, [])

  const insert = (char: string) => {
    const el = inputRef.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    setNativeInputValue(el, el.value.slice(0, start) + char + el.value.slice(end))
    el.focus()
    requestAnimationFrame(() => el.setSelectionRange(start + 1, start + 1))
  }

  const evaluate = () => {
    const el = inputRef.current
    if (!el) return
    const result = evaluateExpression(el.value)
    if (result !== false) {
      setNativeInputValue(el, String(result))
      el.focus()
    }
  }

  return (
    <div className="flex w-full self-stretch gap-1.5 sm:hidden">
      {OPERATORS.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          tabIndex={-1}
          onTouchStart={e => e.preventDefault()}
          onTouchEnd={() => insert(value)}
          onMouseDown={e => e.preventDefault()}
          onClick={() => insert(value)}
          className="flex-1 h-9 rounded-lg bg-muted text-foreground text-base font-medium active:scale-95 transition-transform"
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        tabIndex={-1}
        onTouchStart={e => e.preventDefault()}
        onTouchEnd={evaluate}
        onMouseDown={e => e.preventDefault()}
        onClick={evaluate}
        className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-base font-medium active:scale-95 transition-transform"
      >
        =
      </button>
    </div>
  )
}
