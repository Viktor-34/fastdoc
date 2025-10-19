import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import "@/styles/preview.css";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { getServerAuthSession } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

// Подключаем семейства шрифтов Geist (основной и моноширинный).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Offerdoc",
  description: "Коммерческие предложения: редактор, предпросмотр, PDF, публичные ссылки",
};

// Базовый layout приложения: задаёт язык, фон и подключает шрифты.
export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getServerAuthSession();

  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#F7F7F5] text-slate-900`}>
        <AuthSessionProvider session={session}>
          {children}
          <Toaster position="bottom-right" />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
