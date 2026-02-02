import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, message } = body;

    if (!groupId || !message) {
      return NextResponse.json(
        { error: "groupId e message são obrigatórios" },
        { status: 400 }
      );
    }

    await sendMessage({
      to: groupId,
      message,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Falha ao enviar mensagem", details: errorMessage },
      { status: 500 }
    );
  }
}
