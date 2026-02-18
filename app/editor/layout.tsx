import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { AuthSessionProvider } from "@/components/auth-session-provider";

export default async function EditorLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  return <AuthSessionProvider session={session}>{children}</AuthSessionProvider>;
}
