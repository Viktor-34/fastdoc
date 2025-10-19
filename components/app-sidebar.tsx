"use client"

import Link from "next/link"
import { FilePlus2, LayoutPanelLeftIcon, ListIcon, LogOut, PenSquare, Settings } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  {
    title: "Настройки",
    href: "/settings/profile",
    icon: Settings,
  },
]

// Основной сайдбар приложения со статичными ссылками и кнопкой создания документа.
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Получаем текущий путь, чтобы подсветить активный пункт меню.
  const pathname = usePathname()
  const { data } = useSession()
  const user = data?.user
  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

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
        <div className="flex flex-col gap-3">
          <Button asChild size="sm" className="w-full justify-center gap-2">
            <Link href="/editor">
              <FilePlus2 className="h-4 w-4" />
              Новый документ
            </Link>
          </Button>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2">
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? user?.email ?? "Профиль"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-sidebar-foreground">
                  {user?.name || user?.email || "Без имени"}
                </span>
                {user?.email && (
                  <span className="truncate text-xs text-sidebar-foreground/70">{user.email}</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              title="Выйти"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
