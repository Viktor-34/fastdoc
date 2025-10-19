"use client"

import Link from "next/link"
import { FilePlus2, LayoutPanelLeftIcon, ListIcon, PenSquare } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

// Статичный список ссылок, которые показываем в боковой навигации.
const NAV_ITEMS = [
  {
    title: "Список предложений",
    href: "/",
    icon: ListIcon,
  },
  {
    title: "Каталог",
    href: "/catalog",
    icon: LayoutPanelLeftIcon,
  },
  {
    title: "Новый документ",
    href: "/editor",
    icon: PenSquare,
  },
]

// Основной сайдбар приложения со статичными ссылками и кнопкой создания документа.
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Получаем текущий путь, чтобы подсветить активный пункт меню.
  const pathname = usePathname()

  return (
    /* Сайдбар умеет скрываться на мобильных устройствах (offcanvas-режим). */
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        {/* Верхняя часть с логотипом/названием приложения. */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-base font-semibold"
              tooltip="Offerdoc"
            >
              <Link href="/">Offerdoc</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              // Для главной страницы сравниваем точное совпадение, для остальных — по префиксу.
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)

              return (
                <SidebarMenuItem key={item.href}>
                  {/* Оборачиваем кнопку в Link, чтобы переходить по маршруту Next.js. */}
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      {/* Нижняя зона с кнопкой для создания нового документа. */}
      <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
        <Button asChild size="sm" className="w-full justify-center gap-2">
          <Link href="/editor">
            <FilePlus2 className="h-4 w-4" />
            Новый документ
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
