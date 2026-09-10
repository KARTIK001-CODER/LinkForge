import { cn } from "@/lib/utils"

export function Avatar({ children, className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted", className)} {...props}>{children}</div>
}
export function AvatarFallback({ children, className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex size-full items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold", className)} {...props}>{children}</div>
}
export function AvatarImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null
  return <img src={src} alt={alt} className="aspect-square size-full object-cover" />
}
