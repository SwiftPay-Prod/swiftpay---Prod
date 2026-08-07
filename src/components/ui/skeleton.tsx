import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-surface/80 border border-border/40", className)}
      {...props}
    />
  )
}

export { Skeleton }
