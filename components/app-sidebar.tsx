"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

import {
  AdminPanelIcon,
  CatalogIcon,
  ClientsIcon,
  LogoutIcon,
  NewProposalIcon,
  ProposalsListIcon,
  SettingsIcon,
} from "@/components/icons/sidebar-nav-icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Статичный список ссылок, которые показываем в боковой навигации.
const NAV_ITEMS = [
  {
    title: "Список предложений",
    href: "/",
    icon: ProposalsListIcon,
  },
  {
    title: "Каталог",
    href: "/catalog",
    icon: CatalogIcon,
  },
  {
    title: "Клиенты",
    href: "/clients",
    icon: ClientsIcon,
  },
  {
    title: "Новый документ",
    href: "/editor",
    icon: NewProposalIcon,
  },
]

const SETTINGS_NAV_ITEM = {
  title: "Настройки",
  icon: SettingsIcon,
  items: [
    {
      title: "Настройки профиля",
      href: "/settings/profile",
    },
    {
      title: "Настройки компании",
      href: "/settings/company",
    },
  ],
}

// Пункт меню, доступный только владельцу (OWNER).
const ADMIN_NAV_ITEM = {
  title: "Админ-панель",
  href: "/admin",
  icon: AdminPanelIcon,
}

// Основной сайдбар приложения со статичными ссылками и кнопкой создания документа.
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Получаем текущий путь, чтобы подсветить активный пункт меню.
  const pathname = usePathname()
  const { data } = useSession()
  const user = data?.user
  const isAdmin = user?.isAdmin === true
  const isSettingsRoute = pathname.startsWith("/settings")
  const [isSettingsOpen, setIsSettingsOpen] = useState(isSettingsRoute)

  useEffect(() => {
    if (isSettingsRoute) {
      setIsSettingsOpen(true)
    }
  }, [isSettingsRoute])

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
              className="h-auto rounded-lg px-2 py-2"
              tooltip="Список предложений"
            >
              <Link href="/" aria-label="Список предложений">
                <Image
                  src="/logo.svg"
                  alt="Offerdoc"
                  width={84}
                  height={28}
                  priority
                  className="h-[28px] w-auto"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-5">
          <SidebarMenu className="gap-0.5">
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
                    className="h-auto gap-3 rounded-lg px-2 py-2.5 font-medium text-[#3D3D3A]"
                  >
                    <Link href={item.href} className="group/nav-item flex items-center gap-3 [&>svg]:size-[18px]!">
                      <item.icon
                        className={cn(
                          "size-[18px] shrink-0 text-[#73726C] transition-colors group-hover/nav-item:text-[#FF5929]",
                          isActive && "text-[#FF5929]"
                        )}
                      />
                      <span className="tracking-[-0.02em]">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={SETTINGS_NAV_ITEM.title}
                isActive={isSettingsRoute}
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className="h-auto cursor-pointer gap-3 rounded-lg px-2 py-2.5 font-medium text-[#3D3D3A]"
              >
                <div className="group/nav-item flex w-full items-center gap-3">
                  <SETTINGS_NAV_ITEM.icon
                    className={cn(
                      "size-[18px] shrink-0 text-[#73726C] transition-colors group-hover/nav-item:text-[#FF5929]",
                      isSettingsRoute && "text-[#FF5929]"
                    )}
                  />
                  <span className="tracking-[-0.02em]">{SETTINGS_NAV_ITEM.title}</span>
                  <ChevronDown
                    className={cn(
                      "ml-auto size-4 shrink-0 text-[#73726C] transition-transform duration-200",
                      isSettingsOpen && "rotate-180"
                    )}
                  />
                </div>
              </SidebarMenuButton>
              {isSettingsOpen ? (
                <SidebarMenuSub>
                  {SETTINGS_NAV_ITEM.items.map((item) => {
                    const isActive = pathname.startsWith(item.href)

                    return (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive}
                          className="h-auto rounded-lg px-2 py-2.5 font-medium text-[#3D3D3A]"
                        >
                          <Link href={item.href}>
                            <span
                              className={cn(
                                "size-1 shrink-0 rounded-full transition-colors group-hover/menu-sub-item:bg-[#FF5929]",
                                isActive ? "bg-[#FF5929]" : "bg-[#73726C]"
                              )}
                              aria-hidden="true"
                            />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              ) : null}
            </SidebarMenuItem>
            {isAdmin ? (
              <SidebarMenuItem key={ADMIN_NAV_ITEM.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={ADMIN_NAV_ITEM.title}
                  isActive={pathname.startsWith(ADMIN_NAV_ITEM.href)}
                  className="h-auto gap-3 rounded-lg px-2 py-2.5 font-medium text-[#3D3D3A]"
                >
                  <Link href={ADMIN_NAV_ITEM.href} className="group/nav-item flex items-center gap-3 [&>svg]:size-[18px]!">
                    <ADMIN_NAV_ITEM.icon
                      className={cn(
                        "size-[18px] shrink-0 text-[#73726C] transition-colors group-hover/nav-item:text-[#FF5929]",
                        pathname.startsWith(ADMIN_NAV_ITEM.href) && "text-[#FF5929]"
                      )}
                    />
                    <span className="tracking-[-0.02em]">{ADMIN_NAV_ITEM.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : null}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      {/* Нижняя зона с профилем и отдельной кнопкой выхода. */}
      <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2">
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
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="ring-sidebar-ring flex w-full cursor-pointer items-center justify-start gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-sidebar-foreground outline-hidden transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2"
            title="Выйти"
          >
            <span>Выйти</span>
            <LogoutIcon className="size-[18px] shrink-0 text-[#73726C]" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
