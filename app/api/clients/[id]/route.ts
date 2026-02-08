import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";

const prisma = new PrismaClient();

// Схема валидации для обновления клиента
const updateClientSchema = z.object({
  name: z.string().min(1, "Имя обязательно").optional(),
  company: z.string().optional(),
  contactPerson: z.string().optional(),
  middleName: z.string().optional(),
  position: z.string().optional(),
  email: z.string().email("Некорректный email").optional(),
  phone: z.string().optional(),
});

// GET /api/clients/[id] - получить одного клиента
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем пользователя с workspace
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Получаем клиента
    const client = await prisma.client.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
      select: {
        id: true,
        name: true,
        company: true,
        contactPerson: true,
        middleName: true,
        position: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to fetch client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[id] - обновить клиента
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем пользователя с workspace
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Проверяем что клиент существует и принадлежит workspace
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Парсим и валидируем данные
    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    // Обновляем клиента
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.company !== undefined && { company: validatedData.company || null }),
        ...(validatedData.contactPerson !== undefined && { contactPerson: validatedData.contactPerson || null }),
        ...(validatedData.middleName !== undefined && { middleName: validatedData.middleName || null }),
        ...(validatedData.position !== undefined && { position: validatedData.position || null }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    console.error("Failed to update client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - удалить клиента
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем пользователя с workspace
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true },
    });

    if (!user?.workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Проверяем что клиент существует и принадлежит workspace
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Удаляем клиента
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    console.error("Failed to delete client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
