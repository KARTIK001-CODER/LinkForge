import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string; label: string }[]
}

function Select({ className, children, options, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "flex h-9 w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring disabled:opacity-50",
          className
        )}
        {...props}
      >
        {options ? options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>) : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { Select }
