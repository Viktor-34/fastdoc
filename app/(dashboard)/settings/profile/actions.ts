"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const profileSchema = z.object({
  name: z
    .string({ required_error: "Укажите имя" })
    .trim()
    .min(1, "Минимум 1 символ")
    .max(100, "Максимум 100 символов"),
});

const workspaceSchema = z.object({
  name: z
    .string({ required_error: "Название обязательно" })
    .trim()
    .min(1, "Минимум 1 символ")
    .max(120, "Максимум 120 символов"),
});

export async function updateProfile(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const submission = profileSchema.safeParse({
    name: formData.get("name"),
  });

  if (!submission.success) {
    return {
      ok: false,
      message: submission.error.errors.at(0)?.message ?? "Некорректные данные",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: submission.data.name,
    },
  });

  revalidatePath("/"); // обновляем клиентскую сессию
  return { ok: true, message: "Имя обновлено" };
}

export async function updateWorkspace(formData: FormData) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const submission = workspaceSchema.safeParse({
    name: formData.get("workspaceName"),
  });

  if (!submission.success) {
    return {
      ok: false,
      message: submission.error.errors.at(0)?.message ?? "Некорректные данные",
    };
  }

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return { ok: false, message: "Не найдено рабочее пространство" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== "OWNER" && user.role !== "ADMIN")) {
    return { ok: false, message: "Недостаточно прав для изменения" };
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      name: submission.data.name,
    },
  });

  revalidatePath("/");
  return { ok: true, message: "Рабочая область обновлена" };
}
