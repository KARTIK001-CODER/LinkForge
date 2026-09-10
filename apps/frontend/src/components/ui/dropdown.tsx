import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownContextValue { open: boolean; setOpen: (v:boolean)=>void }
const Ctx = React.createContext<DropdownContextValue | null>(null)

export function Dropdown({ children, open: controlled, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (o:boolean)=>void }) {
  const [internal, setInternal] = React.useState(false)
  const open = controlled ?? internal
  const setOpen = (v:boolean)=> { if (controlled===undefined) setInternal(v); onOpenChange?.(v) }
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>
}

export function DropdownTrigger({ children, className, ...props }: React.ComponentProps<"button">) {
  const ctx = React.useContext(Ctx)!
  return <button onClick={()=> ctx.setOpen(!ctx.open)} className={cn(className)} {...props}>{children}</button>
}

export function DropdownContent({ children, className, align="end" }: { children: React.ReactNode; className?: string; align?: "start"|"end" }) {
  const ctx = React.useContext(Ctx)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(()=>{
    if (!ctx?.open) return
    const h = (e: MouseEvent)=> { if (ref.current && !ref.current.contains(e.target as Node)) ctx.setOpen(false) }
    document.addEventListener("mousedown", h)
    return ()=> document.removeEventListener("mousedown", h)
  }, [ctx?.open])
  if (!ctx?.open) return null
  return (
    <div ref={ref} className={cn("absolute z-50 mt-2 min-w-[160px] rounded-xl border border-border bg-popover p-1 shadow-lg animate-in", align==="end" ? "right-0" : "left-0", className)}>
      {children}
    </div>
  )
}

export function DropdownItem({ children, onClick, className, destructive }: { children: React.ReactNode; onClick?: ()=>void; className?: string; destructive?: boolean }) {
  const ctx = React.useContext(Ctx)
  return (
    <button onClick={()=>{ onClick?.(); ctx?.setOpen(false)}} className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted text-left transition-colors", destructive && "text-destructive hover:bg-destructive/10", className)}>
      {children}
    </button>
  )
}
export function DropdownSeparator() { return <div className="my-1 h-px bg-border" /> }
