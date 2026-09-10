import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export function MetricCard({ label, value, change, changeLabel, icon: Icon, className }: {
  label: string; value: string | number; change?: string; changeLabel?: string; icon?: LucideIcon; className?: string
}) {
  const isPositive = change?.startsWith("+") || change?.startsWith("↑")
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {change && (
            <p className={cn("mt-1 text-xs font-medium", isPositive ? "text-success" : "text-muted-foreground")}>
              {change} {changeLabel && <span className="font-normal text-muted-foreground">{changeLabel}</span>}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </Card>
  )
}
