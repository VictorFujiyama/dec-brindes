import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { artStatus, artName, internalNote, isUrgent, inDailyQueue, artGroupId } = body;

    const updateData: Record<string, unknown> = {};

    if (artStatus !== undefined) {
      updateData.artStatus = artStatus;
      // Se está enviando para produção, salva a data
      if (artStatus === "PRODUCTION") {
        updateData.sentToProductionAt = new Date();
      }
    }

    if (artName !== undefined) {
      updateData.artName = artName;
    }

    if (internalNote !== undefined) {
      updateData.internalNote = internalNote;
    }

    if (isUrgent !== undefined) {
      updateData.isUrgent = isUrgent;
    }

    if (inDailyQueue !== undefined) {
      updateData.inDailyQueue = inDailyQueue;
    }

    if (artGroupId !== undefined) {
      updateData.artGroupId = artGroupId;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
