"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

type VerifyMagicLinkCardProps = {
  token?: string;
};

type VerifyStatus = "loading" | "success" | "error";

export function VerifyMagicLinkCard({ token }: VerifyMagicLinkCardProps) {
  const router = useRouter();
  const didStart = useRef(false);
  const [status, setStatus] = useState<VerifyStatus>(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token
      ? "Проверяем ссылку и подтверждаем вход..."
      : "Ссылка недействительна или устарела. Запросите новую ссылку для входа.",
  );

  useEffect(() => {
    if (didStart.current || !token) return;
    didStart.current = true;

    void (async () => {
      const result = await signIn("magic-link", {
        token,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setStatus("error");
        setMessage("Ссылка недействительна или устарела. Запросите новую ссылку для входа.");
        return;
      }

      setStatus("success");
      setMessage("Вход подтверждён. Перенаправляем в кабинет...");
      router.replace(result?.url ?? "/");
    })();
  }, [router, token]);

  return (
    <div className="mt-6 space-y-6">
      <div
        className={`rounded-2xl border px-4 py-4 text-sm ${
          status === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-neutral-200 bg-neutral-50 text-neutral-600"
        }`}
      >
        <div className="flex items-center gap-3">
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span>{message}</span>
        </div>
      </div>

      {status === "error" ? (
        <div className="text-left text-sm text-neutral-500">
          <Link
            href="/auth/signin"
            className="font-medium text-neutral-700 underline-offset-4 hover:underline"
          >
            Вернуться на страницу входа
          </Link>
        </div>
      ) : null}
    </div>
  );
}
