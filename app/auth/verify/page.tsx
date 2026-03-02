import Image from "next/image";

import { VerifyMagicLinkCard } from "./verify-client";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tokenValue = resolvedSearchParams?.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
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
              Подтверждение входа
            </h1>
            <p className="text-left text-sm text-neutral-500">
              Проверяем ссылку и открываем ваш рабочий кабинет.
            </p>
          </div>

          <VerifyMagicLinkCard token={token} />
        </div>
      </main>
    </div>
  );
}
