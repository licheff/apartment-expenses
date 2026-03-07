import * as React from "react"
import { Avatar as RadixAvatar } from "radix-ui"
import { cn } from "@/lib/utils"

// sm = calendar thumbnails (16px), md = table / list (32px)
const sizes = {
  sm: "size-4 text-[7px]",
  md: "size-8 text-sm",
  lg: "size-12 text-lg",
} as const

type AvatarSize = keyof typeof sizes

function Avatar({
  className,
  size = "md",
  ...props
}: React.ComponentProps<typeof RadixAvatar.Root> & { size?: AvatarSize }) {
  return (
    <RadixAvatar.Root
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-lg",
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof RadixAvatar.Image>) {
  return (
    <RadixAvatar.Image
      className={cn("aspect-square h-full w-full object-contain", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof RadixAvatar.Fallback>) {
  return (
    <RadixAvatar.Fallback
      className={cn(
        "flex h-full w-full items-center justify-center rounded-lg bg-muted text-muted-foreground font-semibold uppercase",
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
