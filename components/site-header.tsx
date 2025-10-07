"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"

interface SiteHeaderProps {
  title: string
  actions?: React.ReactNode
}

export function SiteHeader({ title, actions }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <span className="h-6 w-px bg-neutral-200" aria-hidden="true" />
          <h1 className="text-base font-medium text-neutral-900">{title}</h1>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  )
}
