import type { CSSProperties, ReactNode } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { WorkspaceInitializer } from '@/components/workspace-initializer';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getActiveWorkspaceId } from '@/lib/workspace';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const activeWorkspaceId = getActiveWorkspaceId();
  const sidebarStyles = {
    '--sidebar-width': '20rem',
  } as CSSProperties;

  return (
    <SidebarProvider style={sidebarStyles}>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-sidebar flex min-h-svh flex-1 flex-col overflow-hidden rounded-t-3xl">
        <WorkspaceInitializer workspaceId={activeWorkspaceId} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
