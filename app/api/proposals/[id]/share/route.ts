import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { randomBytes } from "crypto";

// POST /api/proposals/[id]/share - создать публичную ссылку на КП
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();
    
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Проверяем, что КП существует и принадлежит workspace
    const proposal = await prisma.proposal.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Проверяем, есть ли уже активная ссылка
    const existingLink = await prisma.shareLink.findFirst({
      where: {
        proposalId: id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (existingLink) {
      return NextResponse.json({ token: existingLink.token });
    }

    // Создаём новую ссылку
    const token = randomBytes(16).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Ссылка действует 30 дней

    const shareLink = await prisma.shareLink.create({
      data: {
        proposalId: id,
        token,
        expiresAt,
        allowPdf: true,
      },
    });

    return NextResponse.json({ token: shareLink.token });
  } catch (error) {
    console.error("POST /api/proposals/[id]/share error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}






