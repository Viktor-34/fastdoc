"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Чекбокс на основе Radix с кастомным стилизацией.
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-neutral-200 dark:bg-neutral-200/30 data-[state=checked]:bg-[#C6613F] data-[state=checked]:text-white dark:data-[state=checked]:bg-[#C6613F] data-[state=checked]:border-[#C6613F] focus-visible:border-[#C6613F] focus-visible:ring-[#E4B5A6] aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:dark:bg-neutral-800/30 dark:data-[state=checked]:bg-[#C6613F] dark:data-[state=checked]:text-white dark:dark:data-[state=checked]:bg-[#C6613F] dark:data-[state=checked]:border-[#C6613F] dark:focus-visible:border-[#C6613F] dark:focus-visible:ring-[#E4B5A6] dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40 dark:aria-invalid:border-red-900",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
