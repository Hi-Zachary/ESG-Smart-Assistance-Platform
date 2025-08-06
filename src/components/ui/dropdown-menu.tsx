import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ className, open, onOpenChange, children, ...props }, ref) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open !== undefined ? open : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <div ref={ref} className={cn("relative", className)} {...props}>
      <DropdownMenuContext.Provider value={{ isOpen, onOpenChange: handleOpenChange }}>
        {children}
      </DropdownMenuContext.Provider>
    </div>
  )
})
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}>({
  isOpen: false,
  onOpenChange: () => {},
})

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, asChild, children, ...props }, ref) => {
  const { onOpenChange, isOpen } = React.useContext(DropdownMenuContext)

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: () => onOpenChange(!isOpen),
    })
  }

  return (
    <button
      ref={ref}
      className={className}
      onClick={() => onOpenChange(!isOpen)}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end"
  }
>(({ className, align = "center", children, ...props }, ref) => {
  const { isOpen } = React.useContext(DropdownMenuContext)
  
  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md",
        {
          "right-0": align === "end",
          "left-1/2 transform -translate-x-1/2": align === "center",
          "left-0": align === "start",
        },
        "top-full mt-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { onOpenChange } = React.useContext(DropdownMenuContext)

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}