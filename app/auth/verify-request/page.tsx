import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white px-8 py-10 shadow-xl">
          <div className="space-y-4 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-neutral-400">
              Offerdoc
            </p>
            <h1 className="text-2xl font-semibold text-neutral-900">Письмо отправлено</h1>
            <p className="text-sm text-neutral-500">
              Мы отправили ссылку для входа на указанный email. Проверьте входящие и следуйте
              инструкциям из письма. Ссылка активна в течение 15 минут.
            </p>
          </div>
          <div className="mt-8 space-y-3 text-center text-sm text-neutral-500">
            <p>
              Не пришло письмо? Проверьте папку «Спам» или повторите попытку{" "}
              <Link
                href="/auth/signin"
                className="font-medium text-neutral-700 underline-offset-4 hover:underline"
              >
                со страницы входа
              </Link>
              .
            </p>
            <p>
              Если ссылка не работает, запросите новую или свяжитесь с поддержкой{" "}
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
