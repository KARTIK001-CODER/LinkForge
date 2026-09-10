import * as React from "react"
import { cn } from "@/lib/utils"

export function PageHeader({ title, description, actions, className }: { title: string; description?: string; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold tracking-tight leading-none">{title}</h1>
        {description && <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  )
}
