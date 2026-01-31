import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Gera a fila do dia automaticamente
export async function POST(request: NextRequest) {
  try {
    const { count } = await request.json();

    if (!count || count < 1) {
      return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
    }

    // Primeiro, limpa a fila atual
    await prisma.order.updateMany({
      where: { inDailyQueue: true },
      data: { inDailyQueue: false },
    });

    // Busca pedidos elegíveis (PENDING, APPROVED ou PRODUCTION, não enviados)
    // Prioridade: urgentes primeiro, depois por data de envio (mais antigos primeiro)
    const eligibleOrders = await prisma.order.findMany({
      where: {
        artStatus: { in: ["PENDING", "APPROVED", "PRODUCTION"] },
      },
      orderBy: [
        { isUrgent: "desc" }, // Urgentes primeiro
        { shippingDate: "asc" }, // Mais antigos primeiro
      ],
      take: count,
      select: { id: true },
    });

    // Marca os selecionados como na fila do dia
    if (eligibleOrders.length > 0) {
      await prisma.order.updateMany({
        where: { id: { in: eligibleOrders.map((o) => o.id) } },
        data: { inDailyQueue: true },
      });
    }

    return NextResponse.json({
      success: true,
      count: eligibleOrders.length,
    });
  } catch (error) {
    console.error("Error generating daily queue:", error);
    return NextResponse.json(
      { error: "Failed to generate daily queue" },
      { status: 500 }
    );
  }
}

// DELETE: Limpa toda a fila do dia
export async function DELETE() {
  try {
    await prisma.order.updateMany({
      where: { inDailyQueue: true },
      data: { inDailyQueue: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing daily queue:", error);
    return NextResponse.json(
      { error: "Failed to clear daily queue" },
      { status: 500 }
    );
  }
}
