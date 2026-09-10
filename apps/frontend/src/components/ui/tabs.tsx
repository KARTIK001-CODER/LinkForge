import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue { value: string; onValueChange: (v: string)=>void }
const TabsContext = React.createContext<TabsContextValue | null>(null)

function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: React.ComponentProps<"div"> & { defaultValue?: string; value?: string; onValueChange?: (v:string)=>void }) {
  const [internal, setInternal] = React.useState(defaultValue ?? value ?? "")
  const current = value ?? internal
  const handle = (v: string) => { if (!value) setInternal(v); onValueChange?.(v) }
  return (
    <TabsContext.Provider value={{ value: current, onValueChange: handle }}>
      <div data-slot="tabs" className={cn("w-full", className)} {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tabs-list" className={cn("inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-muted p-1", className)} {...props} />
}

function TabsTrigger({ value, children, className, ...props }: React.ComponentProps<"button"> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  const active = ctx?.value === value
  return (
    <button
      data-slot="tabs-trigger"
      data-state={active ? "active" : "inactive"}
      onClick={() => ctx?.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none disabled:opacity-50",
        active ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children, className, ...props }: React.ComponentProps<"div"> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (ctx?.value !== value) return null
  return <div data-slot="tabs-content" className={cn("mt-4", className)} {...props}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
