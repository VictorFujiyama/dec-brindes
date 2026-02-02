import { NextResponse } from "next/server";
import { initializeWhatsApp, getQRCode, getStatus } from "@/lib/whatsapp";

export async function GET() {
  try {
    // Inicia o cliente se não estiver rodando
    await initializeWhatsApp();

    // Aguarda um pouco para o QR code ser gerado
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const status = getStatus();
    const qrCode = getQRCode();

    return NextResponse.json({
      ...status,
      qrCode,
    });
  } catch (error) {
    console.error("Erro ao inicializar WhatsApp:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Falha ao inicializar WhatsApp", details: errorMessage },
      { status: 500 }
    );
  }
}
