import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

// Схема валидации для создания клиента
const createClientSchema = z.object({
  name: z.string().min(1, "Имя обязательно"),
  company: z.string().optional(),
  contactPerson: z.string().optional(),
  middleName: z.string().optional(),
  position: z.string().optional(),
  email: z.string().email("Некорректный email"),
  phone: z.string().optional(),
});

// GET /api/clients - получить список всех клиентов workspace
export async function GET(request: NextRequest) {
  try {
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

    // Получаем всех клиентов workspace
    const clients = await prisma.client.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { updatedAt: "desc" },
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

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - создать нового клиента
export async function POST(request: NextRequest) {
  try {
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

    // Парсим и валидируем данные
    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    // Создаем клиента
    const client = await prisma.client.create({
      data: {
        workspaceId: user.workspaceId,
        name: validatedData.name,
        company: validatedData.company || null,
        contactPerson: validatedData.contactPerson || null,
        middleName: validatedData.middleName || null,
        position: validatedData.position || null,
        email: validatedData.email,
        phone: validatedData.phone || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to create client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
