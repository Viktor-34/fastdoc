import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createRateLimiter } from "@/lib/rate-limit";

const checkRate = createRateLimiter("proposals-id", { limit: 60, windowMs: 60_000 });

// GET /api/proposals/[id] - получить одно КП
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = checkRate(request);
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposal = await prisma.proposal.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            middleName: true,
            position: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("GET /api/proposals/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/proposals/[id] - удалить КП
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = checkRate(request);
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Проверяем, что КП принадлежит текущему workspace
    const existing = await prisma.proposal.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Удаляем КП (каскадно удалятся версии и sharelinks)
    await prisma.proposal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/proposals/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
