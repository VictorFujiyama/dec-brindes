"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ArtStatus } from "@/types/order";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, artStatus } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs array is required" },
        { status: 400 }
      );
    }

    if (!artStatus) {
      return NextResponse.json(
        { error: "artStatus is required" },
        { status: 400 }
      );
    }

    // Se está enviando para produção, salva a data do lote
    const updateData: { artStatus: ArtStatus; sentToProductionAt?: Date } = { artStatus };
    if (artStatus === "PRODUCTION") {
      updateData.sentToProductionAt = new Date();
    }

    const updatedOrders = await prisma.$transaction(
      ids.map((id) =>
        prisma.order.update({
          where: { id },
          data: updateData,
        })
      )
    );

    return NextResponse.json(updatedOrders);
  } catch (error) {
    console.error("Error updating orders:", error);
    return NextResponse.json(
      { error: "Failed to update orders" },
      { status: 500 }
    );
  }
}
