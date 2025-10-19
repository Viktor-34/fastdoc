import Link from "next/link";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Ошибка конфигурации аутентификации. Сообщите в поддержку.",
  AccessDenied: "Доступ запрещён для этой учётной записи.",
  Verification: "Письмо подтверждения недействительно или устарело.",
  OAuthSignin: "Не удалось связаться с OAuth-провайдером. Попробуйте позже.",
  OAuthCallback: "OAuth-провайдер вернул ошибку. Повторите попытку.",
  OAuthCreateAccount: "Не получилось создать профиль через OAuth.",
  EmailCreateAccount: "Не получилось создать профиль через email.",
  EmailSignin: "Не удалось отправить письмо. Проверьте адрес и попробуйте снова.",
  CredentialsSignin: "Неверные учётные данные.",
  SessionRequired: "Чтобы продолжить, войдите в аккаунт.",
  CallbackRouteError: "Не удалось завершить вход. Попробуйте ещё раз.",
  Default: "Что-то пошло не так. Повторите попытку входа.",
};

function resolveError(searchParams?: Record<string, string | string[] | undefined>) {
  const raw = searchParams?.error;
  const code = Array.isArray(raw) ? raw[0] : raw;
  if (!code) return ERROR_MESSAGES.Default;
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default;
}

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const message = resolveError(resolvedSearchParams);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white px-8 py-10 shadow-xl">
          <div className="space-y-4 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-neutral-400">
              Offerdoc
            </p>
            <h1 className="text-2xl font-semibold text-neutral-900">Не удалось войти</h1>
            <p className="text-sm text-neutral-500">{message}</p>
          </div>

          <div className="mt-8 space-y-3 text-center text-sm text-neutral-500">
            <p>
              Попробуйте ещё раз{" "}
              <Link
                href="/auth/signin"
                className="font-medium text-neutral-700 underline-offset-4 hover:underline"
              >
                на странице входа
              </Link>
              .
            </p>
            <p>
              Если проблема повторяется, напишите нам на{" "}
              <a
                href="mailto:support@offerdoc.app"
                className="font-medium text-neutral-700 underline-offset-4 hover:underline"
              >
                support@offerdoc.app
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
