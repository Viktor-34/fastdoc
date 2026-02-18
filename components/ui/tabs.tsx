"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

// Контейнер вкладок: задаёт общую обёртку и отступы.
function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

// Список вкладок (панель кнопок).
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-neutral-100 text-neutral-500 inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] dark:bg-neutral-800 dark:text-neutral-400",
        className
      )}
      {...props}
    />
  )
}

// Одна вкладка-триггер со стилями активного состояния.
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-[#FAEFEB] data-[state=active]:text-[#3d3d3a] dark:data-[state=active]:text-[#3d3d3a] focus-visible:border-[#C6613F] focus-visible:ring-[#E4B5A6] dark:data-[state=active]:border-[#D8A18E] dark:data-[state=active]:bg-[#FAEFEB] text-neutral-950 dark:text-neutral-500 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-200 border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 dark:data-[state=active]:bg-[#FAEFEB] dark:dark:data-[state=active]:text-[#3d3d3a] dark:focus-visible:border-[#C6613F] dark:focus-visible:ring-[#E4B5A6] dark:dark:data-[state=active]:border-[#D8A18E] dark:dark:data-[state=active]:bg-[#FAEFEB] dark:text-neutral-50 dark:dark:text-neutral-400 dark:border-neutral-800",
        className
      )}
      {...props}
    />
  )
}

// Область с содержимым текущей вкладки.
function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
