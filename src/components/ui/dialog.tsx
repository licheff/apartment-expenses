import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { evaluateExpression } from "@/lib/constants"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-xs",
        className
      )}
      {...props}
    />
  )
}

// ── Inline math operator bar (rendered inside the dialog, no portal) ──

const OPERATORS = [
  { label: "+", value: "+" },
  { label: "−", value: "-" },
  { label: "×", value: "*" },
  { label: "÷", value: "/" },
] as const

function setNativeInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event("input", { bubbles: true }))
}

function MathOperatorBar() {
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as HTMLElement).hasAttribute?.("data-math-input")) {
        inputRef.current = e.target as HTMLInputElement
        setVisible(true)
      }
    }
    const onFocusOut = () => {
      setTimeout(() => {
        if (!(document.activeElement as HTMLElement)?.hasAttribute?.("data-math-input")) {
          setVisible(false)
        }
      }, 100)
    }
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    return () => {
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
    }
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

  if (!visible) return null

  return (
    <div className="sticky bottom-0 -mx-6 -mb-6 flex gap-2 px-4 py-3 bg-muted border-t border-border sm:hidden">
      {OPERATORS.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          tabIndex={-1}
          onTouchStart={(e) => e.preventDefault()}
          onTouchEnd={() => insert(value)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(value)}
          className="flex-1 h-11 rounded-xl bg-background text-foreground text-xl font-medium shadow-sm active:scale-95 transition-transform"
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        tabIndex={-1}
        onTouchStart={(e) => e.preventDefault()}
        onTouchEnd={evaluate}
        onMouseDown={(e) => e.preventDefault()}
        onClick={evaluate}
        className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-xl font-medium shadow-sm active:scale-95 transition-transform"
      >
        =
      </button>
    </div>
  )
}

// ── DialogContent ──

function DialogContent({
  className,
  children,
  showCloseButton = true,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Resize dialog to visual viewport on mobile so keyboard doesn't cover content
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      const el = contentRef.current
      if (!el) return
      if (window.innerWidth < 640) {
        el.style.height = `${vv.height}px`
      } else {
        el.style.height = ""
      }
    }

    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [])

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed inset-0 z-50 grid w-full overflow-y-auto gap-4 p-6 shadow-lg duration-200 outline-none sm:inset-auto sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border",
          className
        )}
        style={style}
        {...props}
      >
        {children}
        <MathOperatorBar />
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
