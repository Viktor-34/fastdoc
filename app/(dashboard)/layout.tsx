import type { CSSProperties, ReactNode } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { WorkspaceInitializer } from '@/components/workspace-initializer';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getActiveWorkspaceId } from '@/lib/workspace';

// Базовый layout для внутренних страниц приложения.
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Узнаём активную рабочую область, чтобы подставить её в контекст.
  const activeWorkspaceId = await getActiveWorkspaceId();
  // Задаём ширину боковой панели через CSS-переменную.
  const sidebarStyles = {
    '--sidebar-width': '20rem',
  } as CSSProperties;

  return (
    <SidebarProvider style={sidebarStyles}>
      {/* Сайдбар с навигацией слева. */}
      <AppSidebar variant="inset" />
      <SidebarInset className="flex min-h-svh flex-1 flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-neutral-950">
        {/* Синхронизация рабочей области на клиенте. */}
        <WorkspaceInitializer workspaceId={activeWorkspaceId} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
