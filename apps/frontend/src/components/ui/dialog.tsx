import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps { open: boolean; onOpenChange: (o: boolean)=>void; children: React.ReactNode }

function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])
  if (!open) return null
  return (
    <div data-slot="dialog" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      {children}
    </div>
  )
}

function DialogContent({ className, children, onClose, ...props }: React.ComponentProps<"div"> & { onClose?: ()=>void }) {
  return (
    <div
      data-slot="dialog-content"
      className={cn("relative z-50 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg animate-in max-h-[90vh] overflow-auto", className)}
      {...props}
    >
      {onClose && (
        <button onClick={onClose} className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      )}
      {children}
    </div>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 text-left mb-4", className)} {...props} />
}
function DialogTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-base font-semibold leading-none", className)} {...props} />
}
function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex justify-end gap-2 mt-6", className)} {...props} />
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
