import { cn } from "@repo/design-system/lib/utils"
import { Spinner } from "./spinner"

function SuspenseFallback({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[200px] items-center justify-center", className)}>
      <Spinner className="size-6" />
    </div>
  )
}

export { SuspenseFallback }
