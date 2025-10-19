"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

interface AuthSessionProviderProps {
  session: Session | null;
  children: ReactNode;
}

export function AuthSessionProvider({ session, children }: AuthSessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
