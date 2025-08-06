import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { notificationManager, type Notification } from "@/lib/notifications"
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react"

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "error" | "warning" | "info"
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "info", onClose, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case "success":
          return "bg-green-50 border-green-200 text-green-800"
        case "error":
          return "bg-red-50 border-red-200 text-red-800"
        case "warning":
          return "bg-yellow-50 border-yellow-200 text-yellow-800"
        case "info":
        default:
          return "bg-blue-50 border-blue-200 text-blue-800"
      }
    }

    const getIcon = () => {
      switch (variant) {
        case "success":
          return <CheckCircle className="h-5 w-5 text-green-600" />
        case "error":
          return <AlertCircle className="h-5 w-5 text-red-600" />
        case "warning":
          return <AlertTriangle className="h-5 w-5 text-yellow-600" />
        case "info":
        default:
          return <Info className="h-5 w-5 text-blue-600" />
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-md border p-4 shadow-lg transition-all",
          getVariantStyles(),
          className
        )}
        {...props}
      >
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {props.children}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Toast.displayName = "Toast"

const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm mt-1 opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

const Toaster = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications)
    return unsubscribe
  }, [])

  const handleClose = (id: string) => {
    notificationManager.remove(id)
  }

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[420px]">
      {notifications.map((notification) => (
        <Toast 
          key={notification.id} 
          variant={notification.type}
          onClose={() => handleClose(notification.id)}
        >
          <div>
            <ToastTitle>{notification.title}</ToastTitle>
            {notification.description && (
              <ToastDescription>{notification.description}</ToastDescription>
            )}
          </div>
        </Toast>
      ))}
    </div>
  )
}

export { Toaster, Toast, ToastTitle, ToastDescription }
