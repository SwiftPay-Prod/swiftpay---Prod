import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Tradeoff: default now uses adaptive bg-primary (cobalt on light #494fdf, white on dark #ffffff per DESIGN.md R3).
// This keeps existing callers working (grep variant.*default still valid) while aligning dark app surfaces to
// Revolut spec: button-primary is bg-white text-black h48 on dark canvas. For explicit marketing hero (always white
// even on light) use variant "marketing-primary". lsp references pre-check: no caller relied on cobalt-in-dark explicitly.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs",
        "marketing-primary": "bg-white text-black hover:bg-white/90 shadow-2xs border border-transparent dark:bg-white dark:text-black",
        outline:
          "border-border/80 bg-transparent text-foreground hover:bg-surface hover:border-border",
        secondary:
          "bg-surface text-foreground border border-border/80 hover:bg-surface/80 hover:border-border",
        tertiary:
          "bg-surface/50 text-muted-foreground hover:bg-surface hover:text-foreground border border-border/50",
        ghost:
          "hover:bg-surface hover:text-foreground text-muted-foreground",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 focus-visible:ring-destructive",
        link: "text-accent underline-offset-4 hover:underline rounded-none border-none p-0 h-auto",
      },
      size: {
        default:
          "h-9 gap-2 px-4 text-xs",
        xs: "h-6.5 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7.5 gap-1.5 px-3 text-xs",
        lg: "h-10.5 gap-2 px-5 text-sm",
        icon: "size-9 rounded-md",
        "icon-xs": "size-6.5 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7.5 rounded-md",
        "icon-lg": "size-10 rounded-md",
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
