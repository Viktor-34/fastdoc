import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Набор вариантов бейджа: цвета и стили для разных случаев.
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border border-neutral-200 px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-[#C6613F] focus-visible:ring-[#E4B5A6] focus-visible:ring-[3px] aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 transition-[color,box-shadow] overflow-hidden dark:border-neutral-800 dark:focus-visible:border-[#C6613F] dark:focus-visible:ring-[#E4B5A6] dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40 dark:aria-invalid:border-red-900",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#C6613F] text-white [a&]:hover:bg-[#A04F33] dark:bg-[#C6613F] dark:text-white dark:[a&]:hover:bg-[#A04F33]",
        secondary:
          "border-transparent bg-neutral-100 text-neutral-900 [a&]:hover:bg-neutral-100/90 dark:bg-neutral-800 dark:text-neutral-50 dark:[a&]:hover:bg-neutral-800/90",
        destructive:
          "border-transparent bg-red-500 text-white [a&]:hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-500/60 dark:bg-red-900 dark:[a&]:hover:bg-red-900/90 dark:focus-visible:ring-red-900/20 dark:dark:focus-visible:ring-red-900/40 dark:dark:bg-red-900/60",
        outline:
          "text-neutral-950 [a&]:hover:bg-neutral-100 [a&]:hover:text-neutral-900 dark:text-neutral-50 dark:[a&]:hover:bg-neutral-800 dark:[a&]:hover:text-neutral-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Сам бейдж (можно рендерить как другой тег через asChild).
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
