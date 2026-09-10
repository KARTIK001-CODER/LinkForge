import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium whitespace-nowrap transition-[background,color,border,transform] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-transparent hover:bg-[hsl(var(--primary-hover))] shadow-sm",
        outline: "border-border bg-transparent hover:bg-muted text-foreground",
        secondary: "bg-secondary text-secondary-foreground border-border hover:bg-accent",
        ghost: "border-transparent hover:bg-muted text-muted-foreground hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground border-transparent hover:bg-destructive/90",
        link: "border-transparent text-primary underline-offset-4 hover:underline h-auto p-0",
      },
      size: {
        default: "h-9 px-4 text-[13px] [&_svg:not([class*='size-'])]:size-[14px]",
        sm: "h-7 px-3 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-6 text-sm [&_svg:not([class*='size-'])]:size-4",
        icon: "size-9",
        "icon-sm": "size-7",
        "icon-xs": "size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
