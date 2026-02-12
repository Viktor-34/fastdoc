import { NextRequest, NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type WorkspaceSettingsPayload = Partial<{
  logoUrl: string | null;
  signatureUrl: string | null;
  stampUrl: string | null;
  companyName: string | null;
  inn: string | null;
  ogrn: string | null;
  legalAddress: string | null;
  bankName: string | null;
  bik: string | null;
  accountNumber: string | null;
  vatDefault: boolean;
  vatRate: number | string;
}>;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.user.workspaceId },
      select: {
        logoUrl: true,
        signatureUrl: true,
        stampUrl: true,
        companyName: true,
        inn: true,
        ogrn: true,
        legalAddress: true,
        bankName: true,
        bik: true,
        accountNumber: true,
        vatDefault: true,
        vatRate: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("GET /api/workspace/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Проверка прав: пользователь должен принадлежать рабочему пространству.
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, workspaceId: true },
    });

    if (!user || user.workspaceId !== session.user.workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as WorkspaceSettingsPayload;

    // Валидация данных
    const updateData: Prisma.WorkspaceUpdateInput = {};

    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
    if (body.signatureUrl !== undefined) updateData.signatureUrl = body.signatureUrl;
    if (body.stampUrl !== undefined) updateData.stampUrl = body.stampUrl;
    if (body.companyName !== undefined) updateData.companyName = body.companyName;
    if (body.inn !== undefined) updateData.inn = body.inn;
    if (body.ogrn !== undefined) updateData.ogrn = body.ogrn;
    if (body.legalAddress !== undefined) updateData.legalAddress = body.legalAddress;
    if (body.bankName !== undefined) updateData.bankName = body.bankName;
    if (body.bik !== undefined) updateData.bik = body.bik;
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber;
    if (body.vatDefault !== undefined) updateData.vatDefault = body.vatDefault;
    if (body.vatRate !== undefined) {
      const vatRate = typeof body.vatRate === "string" ? parseInt(body.vatRate, 10) : body.vatRate;
      if (isNaN(vatRate) || vatRate < 0 || vatRate > 100) {
        return NextResponse.json({ error: "Invalid VAT rate" }, { status: 400 });
      }
      updateData.vatRate = vatRate;
    }

    const workspace = await prisma.workspace.update({
      where: { id: session.user.workspaceId },
      data: updateData,
      select: {
        logoUrl: true,
        signatureUrl: true,
        stampUrl: true,
        companyName: true,
        inn: true,
        ogrn: true,
        legalAddress: true,
        bankName: true,
        bik: true,
        accountNumber: true,
        vatDefault: true,
        vatRate: true,
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("PATCH /api/workspace/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
