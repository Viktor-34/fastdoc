"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type OAuthProviderInfo = {
  id: string;
  name: string;
};

interface SignInFormProps {
  oauthProviders: OAuthProviderInfo[];
  initialError?: string;
}

type Feedback =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function SignInForm({ oauthProviders, initialError }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    initialError ? "error" : "idle",
  );
  const [feedback, setFeedback] = useState<Feedback | null>(
    initialError ? { kind: "error", message: initialError } : null,
  );

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) {
      setFeedback({ kind: "error", message: "Введите ваш email." });
      setStatus("error");
      return;
    }

    setStatus("loading");
    setFeedback(null);

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setStatus("error");
          setFeedback({
            kind: "error",
            message: "Слишком много попыток. Подождите немного и попробуйте снова.",
          });
          return;
        }

        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus("error");
        setFeedback({
          kind: "error",
          message: payload?.error ?? "Не удалось отправить письмо. Попробуйте ещё раз.",
        });
        return;
      }

      setStatus("sent");
      setFeedback({
        kind: "success",
        message: "Проверьте почту: ссылка для подтверждения входа отправлена.",
      });
    } catch (error) {
      console.error("[auth] Ошибка отправки magic-link:", error);
      setStatus("error");
      setFeedback({
        kind: "error",
        message: "Что-то пошло не так. Попробуйте позже.",
      });
    }
  }

  const isLoading = status === "loading";
  const isSent = status === "sent";

  return (
    <div className="mt-6 space-y-6">
      <form className="space-y-3" onSubmit={handleEmailSubmit}>
        <label className="block text-left">
          <Input
            type="email"
            inputMode="email"
            placeholder="Введите ваш email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isLoading || isSent}
            className="h-12 rounded-[12px]"
          />
        </label>
        <Button
          type="submit"
          className="h-12 w-full rounded-[12px] gap-2 text-[16px]"
          disabled={isLoading || isSent}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSent ? "Ссылка отправлена" : "Получить ссылку для входа"}
        </Button>
      </form>

      {feedback ? (
        <p
          className={`text-left text-sm ${
            feedback.kind === "error" ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      {oauthProviders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wide text-neutral-400">или</span>
            <Separator className="flex-1" />
          </div>
          <div className="space-y-3">
            {oauthProviders.map((provider) => (
              <Button
                key={provider.id}
                variant="outline"
                className="w-full justify-center"
                onClick={() => signIn(provider.id, { callbackUrl: "/" })}
                type="button"
              >
                Войти через {provider.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
