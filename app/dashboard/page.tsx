import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import data from "./data.json"

export default function Page() {
  const cards = [
    {
      title: "Total Revenue",
      value: "$1,250.00",
      badge: { label: "+12.5%" },
      description: "Trending up this month",
    },
    {
      title: "New Customers",
      value: "1,234",
      badge: { label: "-20%" },
      description: "Down 20% this period",
    },
    {
      title: "Active Accounts",
      value: "45,678",
      badge: { label: "+12.5%" },
      description: "Strong user retention",
    },
    {
      title: "Growth Rate",
      value: "4.5%",
      badge: { label: "+4.5%" },
      description: "Steady performance",
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Documents" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards cards={cards} />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
