import { useEffect, useState } from 'react'
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

  // Show/hide based on whether a math input is focused
  useEffect(() => {
    const isMath = (el: Element | null) => el?.hasAttribute('data-math-input') ?? false

    const onFocusIn = (e: FocusEvent) => {
      if (isMath(e.target as Element)) setVisible(true)
    }

    const onFocusOut = () => {
      // Defer so e.preventDefault() on button mousedown has time to keep focus on input
      setTimeout(() => {
        if (!isMath(document.activeElement)) setVisible(false)
      }, 0)
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
    const el = document.activeElement as HTMLInputElement | null
    if (!el?.hasAttribute('data-math-input')) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const next = el.value.slice(0, start) + char + el.value.slice(end)
    setNativeInputValue(el, next)
    requestAnimationFrame(() => el.setSelectionRange(start + 1, start + 1))
  }

  const evaluate = () => {
    const el = document.activeElement as HTMLInputElement | null
    if (!el?.hasAttribute('data-math-input')) return
    const result = evaluateExpression(el.value)
    if (result !== false) setNativeInputValue(el, String(result))
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
          onPointerDown={e => { e.preventDefault(); e.stopPropagation() }}
          onClick={() => insertAtCursor(value)}
          className="flex-1 h-11 rounded-xl bg-background text-foreground text-xl font-medium shadow-sm active:scale-95 transition-transform"
        >
          {label}
        </button>
      ))}
      <button
        tabIndex={-1}
        onPointerDown={e => { e.preventDefault(); e.stopPropagation() }}
        onClick={evaluate}
        className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-xl font-medium shadow-sm active:scale-95 transition-transform"
      >
        =
      </button>
    </div>,
    document.body
  )
}
