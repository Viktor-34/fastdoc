import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

// POST /api/proposals/[id]/duplicate - дублировать КП
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

    // Получаем исходное КП
    const originalProposal = await prisma.proposal.findFirst({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    if (!originalProposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Создаём копию КП
    const duplicatedProposal = await prisma.proposal.create({
      data: {
        workspaceId: originalProposal.workspaceId,
        clientId: originalProposal.clientId,
        title: `${originalProposal.title} (копия)`,
        recipientName: originalProposal.recipientName,
        problemDesc: originalProposal.problemDesc,
        solutionDesc: originalProposal.solutionDesc,
        additionalDesc: originalProposal.additionalDesc,
        items: originalProposal.items as Prisma.InputJsonValue,
        currency: originalProposal.currency,
        pricingMode: originalProposal.pricingMode,
        productVariants:
          originalProposal.productVariants === null || originalProposal.productVariants === undefined
            ? Prisma.JsonNull
            : (originalProposal.productVariants as Prisma.InputJsonValue),
        activeVariantId: originalProposal.activeVariantId,
        productsView:
          originalProposal.productsView === null || originalProposal.productsView === undefined
            ? Prisma.JsonNull
            : (originalProposal.productsView as Prisma.InputJsonValue),
        deadline: originalProposal.deadline,
        paymentTerms: originalProposal.paymentTerms,
        paymentCustom: originalProposal.paymentCustom,
        validUntil: originalProposal.validUntil,
        includeVat: originalProposal.includeVat,
        vatRate: originalProposal.vatRate,
        galleryImages:
          originalProposal.galleryImages === null || originalProposal.galleryImages === undefined
            ? Prisma.JsonNull
            : (originalProposal.galleryImages as Prisma.InputJsonValue),
        advantages:
          originalProposal.advantages === null || originalProposal.advantages === undefined
            ? Prisma.JsonNull
            : (originalProposal.advantages as Prisma.InputJsonValue),
        advantagesColumns: originalProposal.advantagesColumns,
        visibleSections:
          originalProposal.visibleSections === null || originalProposal.visibleSections === undefined
            ? Prisma.JsonNull
            : (originalProposal.visibleSections as Prisma.InputJsonValue),
        ctaText: originalProposal.ctaText,
        ctaPhone: originalProposal.ctaPhone,
        ctaEmail: originalProposal.ctaEmail,
        notes: originalProposal.notes,
        status: 'draft', // Всегда создаём как черновик
        version: 1,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(duplicatedProposal, { status: 201 });
  } catch (error) {
    console.error("POST /api/proposals/[id]/duplicate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}




