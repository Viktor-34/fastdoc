import type { CSSProperties, ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { WorkspaceInitializer } from '@/components/workspace-initializer';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getServerAuthSession } from '@/lib/auth';
import { getActiveWorkspaceId } from '@/lib/workspace';

// Базовый layout для внутренних страниц приложения.
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect('/auth/signin');
  }
  // Узнаём активную рабочую область, чтобы подставить её в контекст.
  const activeWorkspaceId = await getActiveWorkspaceId(session.user.workspaceId);
  // Задаём ширину боковой панели через CSS-переменную.
  const sidebarStyles = {
    '--sidebar-width': '17.5rem',
    '--sidebar': '#ffffff',
    '--sidebar-foreground': '#3D3D3A', // fallback, primary value in globals.css
    '--sidebar-accent': '#F3F2F0',
    '--sidebar-accent-foreground': '#3D3D3A',
    '--sidebar-border': '#e5e7eb',
  } as CSSProperties;

  return (
    <SidebarProvider style={sidebarStyles}>
      {/* Сайдбар с навигацией слева. */}
      <AppSidebar variant="inset" />
      <SidebarInset className="flex min-h-svh flex-1 flex-col overflow-hidden rounded-t-3xl bg-[#F3F2F0] dark:bg-neutral-950">
        {/* Синхронизация рабочей области на клиенте. */}
        <WorkspaceInitializer workspaceId={activeWorkspaceId} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
