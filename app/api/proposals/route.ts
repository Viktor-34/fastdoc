import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { proposalPatchSchema, proposalSchema } from "@/lib/types/proposal-schema";
import { createRateLimiter } from "@/lib/rate-limit";

const checkRate = createRateLimiter("proposals", { limit: 60, windowMs: 60_000 });

const parseValidUntil = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
};

// GET /api/proposals - получить все КП workspace
export async function GET(request: NextRequest) {
  const blocked = checkRate(request);
  if (blocked) return blocked;

  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposals = await prisma.proposal.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { updatedAt: "desc" },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error("GET /api/proposals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/proposals - создать новое КП
export async function POST(request: NextRequest) {
  const blocked = checkRate(request);
  if (blocked) return blocked;

  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = proposalSchema.parse(body);
    const validUntil = parseValidUntil(validatedData.validUntil);
    const { clientId, ...validatedWithoutClient } = validatedData;

    const proposal = await prisma.proposal.create({
      data: {
        ...validatedWithoutClient,
        workspaceId: session.user.workspaceId,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        validUntil: validUntil ?? null,
        ...(clientId ? { clientId } : {}),
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[POST /api/proposals] Error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PATCH /api/proposals - обновить существующее КП
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = proposalPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id, clientId, ...allowedUpdates } = parsed.data;
    const updates = { ...allowedUpdates } as Record<string, unknown>;
    const validUntil = parseValidUntil(updates.validUntil);
    const clientRelation =
      clientId === undefined
        ? undefined
        : clientId
          ? { connect: { id: clientId } }
          : { disconnect: true };

    // Проверяем, что КП принадлежит текущему workspace
    const existing = await prisma.proposal.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        ...updates,
        updatedBy: session.user.id,
        ...(validUntil !== undefined ? { validUntil } : {}),
        ...(clientRelation ? { Client: clientRelation } : {}),
      },
    });

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("[PATCH /api/proposals] Error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
