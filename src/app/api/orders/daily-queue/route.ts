import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Verifica se o pedido é efetivamente urgente (considerando urgentFromDate)
function isEffectivelyUrgent(order: { isUrgent: boolean; urgentFromDate: Date | null }): boolean {
  if (!order.isUrgent) return false;
  if (!order.urgentFromDate) return true; // Se não tem data, é urgente imediatamente

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const urgentDate = new Date(order.urgentFromDate);
  urgentDate.setHours(0, 0, 0, 0);

  return urgentDate <= today;
}

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

    // Busca todos os pedidos elegíveis (PENDING, APPROVED ou PRODUCTION)
    const allEligibleOrders = await prisma.order.findMany({
      where: {
        artStatus: { in: ["PENDING", "APPROVED", "PRODUCTION"] },
      },
      select: {
        id: true,
        isUrgent: true,
        urgentFromDate: true,
        shippingDate: true
      },
    });

    // Ordena considerando urgência efetiva
    const sortedOrders = allEligibleOrders.sort((a, b) => {
      const aUrgent = isEffectivelyUrgent(a) ? 1 : 0;
      const bUrgent = isEffectivelyUrgent(b) ? 1 : 0;

      // Urgentes efetivos primeiro
      if (bUrgent !== aUrgent) return bUrgent - aUrgent;

      // Depois por data de envio (mais antigos primeiro)
      return new Date(a.shippingDate).getTime() - new Date(b.shippingDate).getTime();
    });

    // Pega os primeiros N
    const eligibleOrders = sortedOrders.slice(0, count);

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
