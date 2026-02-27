import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { evaluateExpression } from '@/lib/constants'

const OPERATORS: { label: string; value: string }[] = [
  { label: '+', value: '+' },
  { label: '−', value: '-' },
  { label: '×', value: '*' },
  { label: '÷', value: '/' },
]

// Required to trigger React's synthetic onChange on a controlled input
function setNativeInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

export function MathKeybar() {
  const [visible, setVisible] = useState(false)
  const [bottom, setBottom] = useState(0)
  // Track the last focused math input so we don't depend on document.activeElement
  // (which may shift when a button is tapped)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (el.hasAttribute('data-math-input')) {
        inputRef.current = el as HTMLInputElement
        setVisible(true)
      }
    }

    const onFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null
        if (!active?.hasAttribute('data-math-input')) {
          setVisible(false)
          inputRef.current = null
        }
      }, 100)
    }

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  // Track keyboard height via visualViewport so bar sits above the keyboard
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      setBottom(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  const insertAtCursor = (char: string) => {
    const el = inputRef.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const next = el.value.slice(0, start) + char + el.value.slice(end)
    setNativeInputValue(el, next)
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

  // Prevent the button tap from stealing focus or triggering Radix's
  // outside-click dismiss. React's e.stopPropagation() only stops synthetic
  // events — we must stop the NATIVE event to block Radix's document listener.
  const preventPointerDefault = (e: React.PointerEvent) => {
    e.preventDefault()
    e.nativeEvent.stopImmediatePropagation()
  }

  if (!visible) return null

  return createPortal(
    <div
      data-math-keybar=""
      className="fixed left-0 right-0 z-[200] flex gap-2 px-4 py-3 bg-muted border-t border-border transition-[bottom] duration-100 sm:hidden"
      style={{ bottom }}
    >
      {OPERATORS.map(({ label, value }) => (
        <button
          key={value}
          tabIndex={-1}
          onPointerDown={preventPointerDefault}
          onPointerUp={() => insertAtCursor(value)}
          className="flex-1 h-11 rounded-xl bg-background text-foreground text-xl font-medium shadow-sm active:scale-95 transition-transform"
        >
          {label}
        </button>
      ))}
      <button
        tabIndex={-1}
        onPointerDown={preventPointerDefault}
        onPointerUp={evaluate}
        className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-xl font-medium shadow-sm active:scale-95 transition-transform"
      >
        =
      </button>
    </div>,
    document.body
  )
}
