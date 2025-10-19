import * as React from "react"

import { cn } from "@/lib/utils"

// Пропсы идентичны стандартному textarea, плюс поддержка className через cn.
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

// Универсальный textarea с forwardRef и базовыми стилями проекта.
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    )
  },
)

Textarea.displayName = "Textarea"
