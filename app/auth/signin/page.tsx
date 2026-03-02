import Image from "next/image";
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
    <div
      className="flex min-h-screen flex-col bg-[#F7F7F5] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/auth-signin-bg.svg')" }}
    >
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white px-8 py-10 shadow-xl">
          <div className="space-y-2 text-left">
            <div className="flex justify-start">
              <Image
                src="/logo.svg"
                alt="Offerdoc"
                width={92}
                height={26}
                priority
                className="h-[26px] w-auto"
              />
            </div>
            <h1
              className="mt-7 text-[24px] font-semibold leading-tight tracking-[-0.02em]"
              style={{ color: "rgb(61, 61, 58)" }}
            >
              Вход в аккаунт
            </h1>
            <p className="text-left text-sm text-neutral-500">
              Мы отправим ссылку для подтверждения входа на указанный email.
            </p>
          </div>

          <SignInForm oauthProviders={enabledOAuthProviders} initialError={errorMessage} />

          <p className="mt-5 text-left text-xs text-neutral-400">
            Отправляя письмо, вы соглашаетесь с политикой конфиденциальности.
          </p>
        </div>
      </main>
    </div>
  );
}
