import { NextRequest, NextResponse } from "next/server";
import { sendMessage, getStatus, formatPaintingMessage } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const status = getStatus();

  if (!status.connected) {
    return NextResponse.json(
      { error: "WhatsApp não está conectado" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { orderIds, groupId } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "IDs de pedidos são obrigatórios" },
        { status: 400 }
      );
    }

    if (!groupId) {
      return NextResponse.json(
        { error: "ID do grupo é obrigatório" },
        { status: 400 }
      );
    }

    // Busca os pedidos no banco
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: "Nenhum pedido encontrado" },
        { status: 404 }
      );
    }

    // Pega a primeira imagem disponível (pedidos não splitados compartilham a mesma arte)
    const imageUrl = orders.find(o => o.artPngUrl)?.artPngUrl;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Nenhum pedido possui imagem da arte" },
        { status: 400 }
      );
    }

    // Formata a mensagem com TODOS os pedidos
    const message = formatPaintingMessage(orders);

    // Envia a mensagem
    await sendMessage({
      to: groupId,
      message,
      imageUrl,
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Falha ao enviar mensagem", details: errorMessage },
      { status: 500 }
    );
  }
}
