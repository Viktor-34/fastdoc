import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";

export default async function LocalPreviewLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  return <>{children}</>;
}
