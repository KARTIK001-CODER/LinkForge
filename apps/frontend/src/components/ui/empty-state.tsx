import { cn } from "@/lib/utils"
import { Button } from "./button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: ()=>void
  className?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-8 py-12 text-center", className)}>
      {Icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-muted">
          <Icon className="size-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      {actionLabel && onAction && (
        <Button size="sm" className="mt-5" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}

export function ErrorState({ title="Something went wrong", description="We couldn't load this data. Please try again.", onRetry }: { title?: string; description?: string; onRetry?: ()=>void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-8 py-12 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

export function LoadingState({ rows=3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_,i)=>(
        <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-muted/50" />
      ))}
    </div>
  )
}
