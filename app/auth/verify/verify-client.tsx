"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

type VerifyMagicLinkCardProps = {
  token?: string;
};

export function VerifyMagicLinkCard({ token }: VerifyMagicLinkCardProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !token) return;
    startedRef.current = true;
    window.location.replace(`/auth/verify/complete?token=${encodeURIComponent(token)}`);
  }, [token]);

  if (!token) {
    return (
      <div className="mt-6 space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          Ссылка недействительна или устарела. Запросите новую ссылку для входа.
        </div>

        <div className="text-left text-sm text-neutral-500">
          <Link
            href="/auth/signin"
            className="font-medium text-neutral-700 underline-offset-4 hover:underline"
          >
            Вернуться на страницу входа
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-600">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Проверяем ссылку и подтверждаем вход...</span>
        </div>
      </div>
    </div>
  );
}
