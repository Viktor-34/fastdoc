import Link from "next/link";
import { redirect } from "next/navigation";

import { enabledOAuthProviders, getServerAuthSession } from "@/lib/auth";

import { SignInForm } from "./sign-in-form";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Не удалось связаться с провайдером авторизации.",
  OAuthCallback: "Провайдер авторизации вернул ошибку. Попробуйте ещё раз.",
  OAuthAccountNotLinked:
    "Похоже, что email уже используется для другого способа входа. Подтвердите через magic-link.",
  EmailSignin: "Не удалось отправить письмо. Проверьте адрес и попробуйте позже.",
  CredentialsSignin: "Неверные учётные данные.",
  AccessDenied: "Доступ запрещён для этой учётной записи.",
  Verification: "Ссылка недействительна или устарела.",
  Default: "Не удалось авторизоваться. Попробуйте ещё раз.",
};

function resolveAuthError(searchParams?: Record<string, string | string[] | undefined>) {
  const value = searchParams?.error;
  const errorCode = Array.isArray(value) ? value[0] : value;
  if (!errorCode) return undefined;
  return AUTH_ERROR_MESSAGES[errorCode] ?? AUTH_ERROR_MESSAGES.Default;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const session = await getServerAuthSession();
  if (session?.user) {
    redirect("/");
  }

  const errorMessage = resolveAuthError(resolvedSearchParams);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white px-8 py-10 shadow-xl">
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-neutral-400">
              Offerdoc
            </p>
            <h1 className="text-2xl font-semibold text-neutral-900">Вход в аккаунт</h1>
            <p className="text-sm text-neutral-500">
              Используйте одноразовую ссылку на email или подключите OAuth-провайдер.
            </p>
          </div>

          <SignInForm oauthProviders={enabledOAuthProviders} initialError={errorMessage} />

          <p className="mt-8 text-center text-xs text-neutral-400">
            Отправляя письмо, вы соглашаетесь с{" "}
            <Link
              href="https://offerdoc.app/privacy"
              className="font-medium text-neutral-600 underline-offset-4 hover:underline"
            >
              политикой конфиденциальности
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
