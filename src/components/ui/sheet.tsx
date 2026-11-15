"use client"

import * as React from "react"
import { cn } from "cn"
import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"

const SheetVisibilityContext = React.createContext(false)

function Sheet({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  const [isRendered, setIsRendered] = React.useState(isOpen)
  const [isVisible, setIsVisible] = React.useState(isOpen)

  if (isOpen && !isRendered) {
    setIsRendered(true)
  }
  if (!isOpen && isVisible) {
    setIsVisible(false)
  }

  React.useEffect(() => {
    if (isOpen) {
      let frame2 = 0
      const frame1 = window.requestAnimationFrame(() => {
        frame2 = window.requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })
      return () => {
        window.cancelAnimationFrame(frame1)
        if (frame2) window.cancelAnimationFrame(frame2)
      }
    }

    if (isRendered) {
      const timer = window.setTimeout(() => {
        setIsRendered(false)
      }, 320)
      return () => window.clearTimeout(timer)
    }
  }, [isOpen, isRendered])

  function handleOpenChange(nextOpen: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  return (
    <SheetVisibilityContext.Provider value={isVisible}>
      <SheetPrimitive.Root
        data-slot="sheet"
        open={isRendered}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </SheetVisibilityContext.Provider>
  )
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  const isVisible = React.useContext(SheetVisibilityContext)

  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  const isVisible = React.useContext(SheetVisibilityContext)

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background shadow-xl will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          side === "right" &&
            cn(
              "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
              isVisible ? "translate-x-0" : "translate-x-full"
            ),
          side === "left" &&
            cn(
              "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
              isVisible ? "translate-x-0" : "-translate-x-full"
            ),
          side === "top" &&
            cn(
              "inset-x-0 top-0 h-auto border-b",
              isVisible ? "translate-y-0" : "-translate-y-full"
            ),
          side === "bottom" &&
            cn(
              "inset-x-0 bottom-0 h-auto border-t",
              isVisible ? "translate-y-0" : "translate-y-full"
            ),
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-secondary">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
