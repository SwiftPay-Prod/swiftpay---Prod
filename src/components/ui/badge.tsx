import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-accent/15 text-accent border-accent/30",
        primary:
          "bg-accent/15 text-accent border-accent/30",
        secondary:
          "bg-surface text-muted-foreground border-border/80",
        destructive:
          "bg-rose-500/10 text-rose-400 border-rose-500/20",
        warning:
          "bg-amber-500/10 text-amber-400 border-amber-500/20",
        success:
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        outline:
          "border-border/80 text-foreground bg-transparent",
        ghost:
          "border-transparent bg-surface text-muted-foreground",
        link: "border-transparent text-accent underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
